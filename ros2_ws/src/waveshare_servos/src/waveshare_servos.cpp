#include "waveshare_servos.hpp"

#include <vector>
#include <algorithm>
#include <cctype>
#include <cmath>
#include <exception>
#include <string>
#include <limits>  // for quiet_NaN

#include "hardware_interface/types/hardware_interface_type_values.hpp"
#include "rclcpp/rclcpp.hpp"

namespace waveshare_servos
{
namespace
{
constexpr u8 kFeedbackStartAddr = SMS_STS_PRESENT_POSITION_L;
constexpr u8 kFeedbackPacketLen = SMS_STS_PRESENT_CURRENT_H - SMS_STS_PRESENT_POSITION_L + 1;
constexpr u8 kTempOffset = SMS_STS_PRESENT_TEMPERATURE - SMS_STS_PRESENT_POSITION_L;
constexpr u8 kCurrentOffset = SMS_STS_PRESENT_CURRENT_L - SMS_STS_PRESENT_POSITION_L;

int decode_signed_word(const u8 * data, size_t offset, u8 neg_bit)
{
	int value = static_cast<int>(data[offset]) | (static_cast<int>(data[offset + 1]) << 8);
	if (value & (1 << neg_bit))
	{
		value = -(value & ~(1 << neg_bit));
	}
	return value;
}

bool parse_bool_param(const std::string & value, bool & out)
{
	std::string normalized = value;
	std::transform(
		normalized.begin(),
		normalized.end(),
		normalized.begin(),
		[](unsigned char c) { return static_cast<char>(std::tolower(c)); });
	if (normalized == "true" || normalized == "1" || normalized == "yes" || normalized == "on")
	{
		out = true;
		return true;
	}
	if (normalized == "false" || normalized == "0" || normalized == "no" || normalized == "off")
	{
		out = false;
		return true;
	}
	return false;
}
}  // namespace

hardware_interface::CallbackReturn WaveshareServos::on_init(
	const hardware_interface::HardwareInfo & info)
{
	if (
		hardware_interface::SystemInterface::on_init(info) !=
    	hardware_interface::CallbackReturn::SUCCESS)
  	{
    	return hardware_interface::CallbackReturn::ERROR;
  	}

	const auto port_it = info_.hardware_parameters.find("device_port");
	if (port_it != info_.hardware_parameters.end() && !port_it->second.empty())
	{
		port_ = port_it->second;
	}

	const auto baud_it = info_.hardware_parameters.find("baud_rate");
	if (baud_it != info_.hardware_parameters.end() && !baud_it->second.empty())
	{
		try
		{
			baudrate_ = std::stoi(baud_it->second);
		}
		catch (const std::exception &)
		{
			RCLCPP_FATAL(
				rclcpp::get_logger("waveshare_servos"),
				"invalid baud_rate '%s' in ros2_control hardware parameters",
				baud_it->second.c_str());
			return hardware_interface::CallbackReturn::ERROR;
		}
	}

	const auto timeout_it = info_.hardware_parameters.find("io_timeout_ms");
	if (timeout_it != info_.hardware_parameters.end() && !timeout_it->second.empty())
	{
		try
		{
			io_timeout_ms_ = std::stoi(timeout_it->second);
		}
		catch (const std::exception &)
		{
			RCLCPP_FATAL(
				rclcpp::get_logger("waveshare_servos"),
				"invalid io_timeout_ms '%s' in ros2_control hardware parameters",
				timeout_it->second.c_str());
			return hardware_interface::CallbackReturn::ERROR;
		}
	}

	const auto sync_read_it = info_.hardware_parameters.find("enable_sync_read");
	if (sync_read_it != info_.hardware_parameters.end() && !sync_read_it->second.empty())
	{
		if (!parse_bool_param(sync_read_it->second, use_sync_read_))
		{
			RCLCPP_FATAL(
				rclcpp::get_logger("waveshare_servos"),
				"invalid enable_sync_read '%s' in ros2_control hardware parameters",
				sync_read_it->second.c_str());
			return hardware_interface::CallbackReturn::ERROR;
		}
	}

	const auto estimate_state_it =
		info_.hardware_parameters.find("estimate_state_from_commands");
	if (estimate_state_it != info_.hardware_parameters.end() && !estimate_state_it->second.empty())
	{
		if (!parse_bool_param(estimate_state_it->second, estimate_state_from_commands_))
		{
			RCLCPP_FATAL(
				rclcpp::get_logger("waveshare_servos"),
				"invalid estimate_state_from_commands '%s' in ros2_control hardware parameters",
				estimate_state_it->second.c_str());
			return hardware_interface::CallbackReturn::ERROR;
		}
	}

	// check urdf definitions
	pos_offsets_.resize(info_.joints.size(), 0.0);
	is_velocity_joint_.resize(info_.joints.size(), false);
	int i = 0;
	for (const hardware_interface::ComponentInfo & joint : info_.joints)
	{
		all_ids_.emplace_back(std::stoul(joint.parameters.find("id")->second));
		// check num, order, and type of state interfaces
		if (joint.state_interfaces.size() != 4)
		{
			RCLCPP_FATAL(rclcpp::get_logger("waveshare_servos"),
				"joint has the wrong number of state interfaces");
			return hardware_interface::CallbackReturn::ERROR;
		}
		if (joint.state_interfaces[0].name != hardware_interface::HW_IF_POSITION)
		{
			RCLCPP_FATAL(rclcpp::get_logger("waveshare_servos"),
				"a joint does not have the position state interface first");
			return hardware_interface::CallbackReturn::ERROR;
		}
		if (joint.state_interfaces[1].name != hardware_interface::HW_IF_VELOCITY)
		{
			RCLCPP_FATAL(rclcpp::get_logger("waveshare_servos"),
				"a joint does not have the velocity state interface second");
			return hardware_interface::CallbackReturn::ERROR;
		}
		if (joint.state_interfaces[2].name != "torque")
		{
			RCLCPP_FATAL(rclcpp::get_logger("waveshare_servos"),
				"a joint does not have the torque state interface third");
			return hardware_interface::CallbackReturn::ERROR;
		}
		if (joint.state_interfaces[3].name != "temperature")
		{
			RCLCPP_FATAL(rclcpp::get_logger("waveshare_servos"),
				"a joint does not have the temperature state interface fourth");
			return hardware_interface::CallbackReturn::ERROR;
		}
		// check presence and types of command interfaces
		if (joint.command_interfaces.size() < 1)
		{
			RCLCPP_FATAL(rclcpp::get_logger("waveshare_servos"), 
				"a joint does not have a command interfaces");
			return hardware_interface::CallbackReturn::ERROR;
		}
		for (long unsigned int ci = 0; ci < joint.command_interfaces.size(); ci++)
		{
			if (joint.command_interfaces[ci].name != hardware_interface::HW_IF_POSITION &&
				joint.command_interfaces[ci].name != hardware_interface::HW_IF_VELOCITY)
			{
				RCLCPP_FATAL(rclcpp::get_logger("waveshare_servos"),
					"a joint is using a command interface that isn't position or velocity");
				return hardware_interface::CallbackReturn::ERROR;
			}
		}
		// store ids in different vectors by type
		if (joint.parameters.find("type")->second == "pos")
		{
			pos_ids_.emplace_back(std::stoul(joint.parameters.find("id")->second));
			pos_is_.emplace_back(i);
			is_velocity_joint_[i] = false;
		} 
		else if (joint.parameters.find("type")->second == "vel") 
		{
			vel_ids_.emplace_back(std::stoul(joint.parameters.find("id")->second));
			vel_is_.emplace_back(i);
			is_velocity_joint_[i] = true;
		}
		else 
		{
			RCLCPP_FATAL(rclcpp::get_logger("waveshare_servos"), 
				"a joint has the wrong type, it should be vel or pos");
			return hardware_interface::CallbackReturn::ERROR;
		}
		// save pose offsets to work around motor movement limitations
		auto offset = joint.parameters.find("offset");
    	if (offset != joint.parameters.end())
    	{
      		pos_offsets_[i] = std::stod(offset->second);  
    	}
		i++;
	}
	// init vectors for state interfaces
	pos_states_.resize(all_ids_.size(), 0.0);
	vel_states_.resize(all_ids_.size(), 0.0);
	torq_states_.resize(all_ids_.size(), 0.0);
	temp_states_.resize(all_ids_.size(), 0.0);
	// create vectors for command interfaces
	pos_cmds_.resize(all_ids_.size(), 0.0);
	vel_cmds_.resize(all_ids_.size(), 0.0);

	// ---- ADDED (unwrap state storage) ----
	last_raw_.resize(all_ids_.size(), std::numeric_limits<double>::quiet_NaN());
	rev_count_.resize(all_ids_.size(), 0);
	last_pos_meas_.resize(all_ids_.size(), std::numeric_limits<double>::quiet_NaN());
	// -------------------------------------

	return hardware_interface::CallbackReturn::SUCCESS;
}

hardware_interface::CallbackReturn WaveshareServos::on_configure(
  	const rclcpp_lifecycle::State & /*previous_state*/)
{
	const int startup_timeout_ms = std::max(io_timeout_ms_, 25);
	// start servo communication
	RCLCPP_INFO(
		rclcpp::get_logger("waveshare_servos"),
		"opening servo bus on '%s' at %d baud (startup timeout %d ms, runtime timeout %d ms, sync_read %s)",
		port_.c_str(),
		baudrate_,
		startup_timeout_ms,
		io_timeout_ms_,
		use_sync_read_ ? "enabled" : "disabled");
	if (estimate_state_from_commands_)
	{
		RCLCPP_INFO(
			rclcpp::get_logger("waveshare_servos"),
			"using command-estimated joint states for control-loop reads");
	}
	if (!sm_st.begin(baudrate_, port_.c_str()))
	{
		RCLCPP_ERROR(
			rclcpp::get_logger("waveshare_servos"),
			"failed to open servo bus on '%s' at %d baud",
			port_.c_str(), baudrate_);
		return hardware_interface::CallbackReturn::ERROR;
	}
	sm_st.IOTimeOut = startup_timeout_ms;
	// ping motors
	for (size_t i = 0; i < all_ids_.size(); i++)
	{
		if (sm_st.Ping(all_ids_[i]) == -1)
		{
			RCLCPP_WARN(rclcpp::get_logger("waveshare_servos"), 
				"unable to ping motor id '%d'", all_ids_[i]);
		}
	}
	if (use_sync_read_ && !all_ids_.empty())
	{
		sm_st.syncReadEnd();
		sm_st.syncReadBegin(static_cast<u8>(all_ids_.size()), kFeedbackPacketLen);
	}
	// pointers to ids for motor control
	p_ids_pnt_ = pos_ids_.empty() ? nullptr : &pos_ids_[0];
	v_ids_pnt_ = vel_ids_.empty() ? nullptr : &vel_ids_[0];
	// arrays for servo commands
	p_pos_ar_ = new s16[pos_ids_.size()];
	p_vel_ar_ = new u16[pos_ids_.size()];
	p_acc_ar_ = new  u8[pos_ids_.size()];
	v_vel_ar_ = new s16[vel_ids_.size()];
	v_acc_ar_ = new  u8[vel_ids_.size()];
	// set motor modes: 0 = servo, 1 = closed loop wheel; set max acceleration
	for (u8 i = 0; i < pos_ids_.size(); i++)
	{
		sm_st.Mode(pos_ids_[i], 0); 
		p_acc_ar_[i] = max_acc_;
	}
	for (u8 i = 0; i < vel_ids_.size(); i++)
	{
		sm_st.Mode(vel_ids_[i], 1);
		v_acc_ar_[i] = max_acc_;
		sm_st.writeByte(vel_ids_[i], SMS_STS_ACC, max_acc_);
	}
	return hardware_interface::CallbackReturn::SUCCESS;
}

std::vector<hardware_interface::StateInterface> WaveshareServos::export_state_interfaces()
{
	std::vector<hardware_interface::StateInterface> state_interfaces;
	for (u8 i = 0; i < all_ids_.size(); i++)
	{
		state_interfaces.emplace_back(hardware_interface::StateInterface(
			info_.joints[i].name, hardware_interface::HW_IF_POSITION, &pos_states_[i]));
		state_interfaces.emplace_back(hardware_interface::StateInterface(
			info_.joints[i].name, hardware_interface::HW_IF_VELOCITY, &vel_states_[i]));
		state_interfaces.emplace_back(hardware_interface::StateInterface(
			info_.joints[i].name, "torque", &torq_states_[i]));
		state_interfaces.emplace_back(hardware_interface::StateInterface(
			info_.joints[i].name, "temperature", &temp_states_[i]));
	}
	return state_interfaces;
}

std::vector<hardware_interface::CommandInterface> WaveshareServos::export_command_interfaces()
{
	std::vector<hardware_interface::CommandInterface> command_interfaces;
	for (u8 i = 0; i < all_ids_.size(); i++)
	{
		for (long unsigned int ci = 0; ci < info_.joints[i].command_interfaces.size(); ci++)
		{
			if (info_.joints[i].command_interfaces[ci].name == hardware_interface::HW_IF_POSITION) 
			{
				command_interfaces.emplace_back(hardware_interface::CommandInterface(
					info_.joints[i].name, hardware_interface::HW_IF_POSITION, &pos_cmds_[i]));
			}
			if (info_.joints[i].command_interfaces[ci].name == hardware_interface::HW_IF_VELOCITY) 
			{
				command_interfaces.emplace_back(hardware_interface::CommandInterface(
					info_.joints[i].name, hardware_interface::HW_IF_VELOCITY, &vel_cmds_[i]));
			}
		}
	}
	return command_interfaces;
}

hardware_interface::CallbackReturn WaveshareServos::on_activate(
	const rclcpp_lifecycle::State & /*previous_state*/)
{
	if (estimate_state_from_commands_)
	{
		for (size_t i = 0; i < all_ids_.size(); i++)
		{
			pos_states_[i] = 0.0;
			vel_states_[i] = 0.0;
			torq_states_[i] = 0.0;
			temp_states_[i] = 0.0;
			pos_cmds_[i] = pos_states_[i];
			vel_cmds_[i] = 0.0;
			last_raw_[i] = std::numeric_limits<double>::quiet_NaN();
			last_pos_meas_[i] = pos_states_[i];
			rev_count_[i] = 0;
		}
		return hardware_interface::CallbackReturn::SUCCESS;
	}

	sm_st.IOTimeOut = std::max(io_timeout_ms_, 25);
	// set position commands to current positions before any movement to not move on start
	for (size_t i = 0; i < all_ids_.size(); i++)
  	{
		const int id = all_ids_[i];
		if (sm_st.FeedBack(id) != -1)
		{
			const double sign = (id == 2 || id == 4) ? -1.0 : 1.0;
			const double pos_meas =
				sign * (sm_st.ReadPos(-1) * 2.0 * M_PI / steps_) - pos_offsets_[i];
			pos_states_[i] = pos_meas;
			vel_states_[i] = 0.0;
			torq_states_[i] = sm_st.ReadCurrent(-1) * 6.0 / 1000.0 * KT_;
			temp_states_[i] = static_cast<double>(sm_st.ReadTemper(-1));
			last_raw_[i] = std::numeric_limits<double>::quiet_NaN();
			last_pos_meas_[i] = pos_meas;
		}
		else
		{
			vel_states_[i] = 0.0;
			last_raw_[i] = std::numeric_limits<double>::quiet_NaN();
			last_pos_meas_[i] = std::numeric_limits<double>::quiet_NaN();
			RCLCPP_WARN(
				rclcpp::get_logger("waveshare_servos"),
				"initial feedback read failed for motor id '%d'; holding default state",
				id);
		}
		pos_cmds_[i] = pos_states_[i];
  	}
	sm_st.IOTimeOut = io_timeout_ms_;
	return hardware_interface::CallbackReturn::SUCCESS;
}

hardware_interface::CallbackReturn WaveshareServos::on_deactivate(
	const rclcpp_lifecycle::State & /*previous_state*/)
{
	// set velocities to 0 on close, doesn't work on ctrl-C
	for (size_t i = 0; i < vel_cmds_.size(); i++)
	{
    	vel_cmds_[i] = 0.0;
  	}
	auto now    = rclcpp::Clock().now();
  	auto period = rclcpp::Duration(0, 0);  // zero duration
  	this->write(now, period);
	return hardware_interface::CallbackReturn::SUCCESS;
}

hardware_interface::return_type WaveshareServos::read(
	const rclcpp::Time & /*time*/, const rclcpp::Duration & period)  // <-- use period
{
	const double dt = std::max(1e-6, period.seconds());               // <-- added
	static rclcpp::Clock throttle_clock(RCL_STEADY_TIME);

	if (estimate_state_from_commands_)
	{
		for (size_t i = 0; i < all_ids_.size(); i++)
		{
			if (is_velocity_joint_[i])
			{
				const double cmd_vel = std::isfinite(vel_cmds_[i]) ? vel_cmds_[i] : 0.0;
				vel_states_[i] = cmd_vel;
				pos_states_[i] += cmd_vel * dt;
			}
			else
			{
				pos_states_[i] = std::isfinite(pos_cmds_[i]) ? pos_cmds_[i] : pos_states_[i];
				vel_states_[i] = std::isfinite(vel_cmds_[i]) ? vel_cmds_[i] : 0.0;
			}
			torq_states_[i] = 0.0;
			temp_states_[i] = 0.0;
			last_pos_meas_[i] = pos_states_[i];
			last_raw_[i] = std::numeric_limits<double>::quiet_NaN();
			rev_count_[i] = 0;
		}
		return hardware_interface::return_type::OK;
	}

	bool use_sync_feedback = use_sync_read_ && !all_ids_.empty();

	if (use_sync_feedback)
	{
		const int rx_len = sm_st.syncReadPacketTx(
			all_ids_.data(), static_cast<u8>(all_ids_.size()), kFeedbackStartAddr, kFeedbackPacketLen);
		const int expected_rx_len =
			static_cast<int>(all_ids_.size()) * static_cast<int>(kFeedbackPacketLen + 6);
		if (rx_len != expected_rx_len)
		{
			RCLCPP_WARN_THROTTLE(
				rclcpp::get_logger("waveshare_servos"),
				throttle_clock,
				2000,
				"syncRead received %d bytes, expected %d; falling back to per-servo feedback",
				rx_len,
				expected_rx_len);
			use_sync_feedback = false;
		}
	}

	for (size_t i = 0; i < all_ids_.size(); i++)
	{
		const int id = all_ids_[i];
		u8 feedback[kFeedbackPacketLen];
		int position = 0;
		int current = 0;
		int temperature = 0;

		if (use_sync_feedback)
		{
			if (sm_st.syncReadPacketRx(id, feedback) != kFeedbackPacketLen)
			{
				RCLCPP_WARN_THROTTLE(
					rclcpp::get_logger("waveshare_servos"),
					throttle_clock,
					2000,
					"syncRead decode failed for motor id '%d'; falling back to per-servo feedback",
					id);
				use_sync_feedback = false;
			}
		}

		if (use_sync_feedback)
		{
			position = decode_signed_word(feedback, 0, 15);
			current = decode_signed_word(feedback, kCurrentOffset, 15);
			temperature = feedback[kTempOffset];
		}
		else
		{
			if (sm_st.FeedBack(id) == -1)
			{
				RCLCPP_WARN_THROTTLE(
					rclcpp::get_logger("waveshare_servos"),
					throttle_clock,
					2000,
					"feedback read failed for motor id '%d'",
					id);
				const double fallback_vel = std::isfinite(vel_cmds_[i]) ? vel_cmds_[i] : 0.0;
				vel_states_[i] = fallback_vel;
				pos_states_[i] += fallback_vel * dt;
				torq_states_[i] = 0.0;
				temp_states_[i] = 0.0;
				last_raw_[i] = std::numeric_limits<double>::quiet_NaN();
				last_pos_meas_[i] = std::numeric_limits<double>::quiet_NaN();
				continue;
			}
			position = sm_st.ReadPos(-1);
			current = sm_st.ReadCurrent(-1);
			temperature = sm_st.ReadTemper(-1);
		}

		// ---- CHANGED: unwrap raw servo angle (no sign) ----
		double raw_no_sign = position * 2.0 * M_PI / steps_;  // [0, 2π)
		if (!std::isfinite(last_raw_[i])) {
			last_raw_[i] = raw_no_sign;  // first sample
		} else {
			double d = raw_no_sign - last_raw_[i];
			if (d >  M_PI) rev_count_[i] -= 1;  // crossed 2π -> 0
			if (d < -M_PI) rev_count_[i] += 1;  // crossed 0  -> 2π
			last_raw_[i] = raw_no_sign;
		}
		double unwrapped = raw_no_sign + rev_count_[i] * 2.0 * M_PI;

		// apply sign (ID==2 inverted) and your configured offset
		const double sign = (id == 2 || id == 4) ? -1.0 : 1.0;
		const double pos_meas = sign * unwrapped - pos_offsets_[i];

    	pos_states_[i] = pos_meas;

		// ---- CHANGED: velocity from unwrapped position (consistent & spike-free) ----
		if (std::isfinite(last_pos_meas_[i])) {
			vel_states_[i] = (pos_meas - last_pos_meas_[i]) / dt;
		} else {
			vel_states_[i] = 0.0;
		}
		last_pos_meas_[i] = pos_meas;
		// ----------------------------------------------------

		torq_states_[i] = current * 6.0 / 1000.0 * KT_;
		temp_states_[i] = static_cast<double>(temperature);
	}
	return hardware_interface::return_type::OK;
}

hardware_interface::return_type WaveshareServos::write(
	const rclcpp::Time & /*time*/, const rclcpp::Duration & /*period*/)
{
	// position-mode servos
	for (size_t i = 0; i < pos_is_.size(); i++)
	{
		// Determine sign based on the actual servo ID for this index
		const int servo_id = pos_ids_[i];
		const double sign = (servo_id == 2 || servo_id == 4) ? -1.0 : 1.0;

		// Desired robot-frame absolute angle is (cmd + offset).
		// Servo-frame target should flip sign for ID=2.
		double robot_target = pos_cmds_[pos_is_[i]] + pos_offsets_[pos_is_[i]];
		double servo_target = sign * robot_target;

		p_pos_ar_[i] = static_cast<s16>((servo_target * steps_) / (2 * M_PI));

		// For position-mode speed, many servos expect magnitude (u16). Use abs().
		double robot_speed = vel_cmds_[pos_is_[i]];
		double servo_speed_mag = std::abs(sign * robot_speed);
		p_vel_ar_[i] = static_cast<u16>((servo_speed_mag * steps_) / (2 * M_PI));
	}

	// wheel-mode servos (velocity control)
	for (size_t i = 0; i < vel_is_.size(); i++)
	{
		const int servo_id = vel_ids_[i];
		const double sign = (servo_id == 2 || servo_id == 4) ? -1.0 : 1.0;

		double robot_vel = vel_cmds_[vel_is_[i]];
		double servo_vel = sign * robot_vel;


		//
		static rclcpp::Clock clock(RCL_STEADY_TIME);
		auto logger = rclcpp::get_logger("waveshare_servos");

		// Example indices (adjust to your joint ordering!)
		//const int L = 0; // index of left_wheel_joint in all_ids_/vel_cmds_
		//const int R = 1; // index of right_wheel_joint

		//RCLCPP_INFO_THROTTLE(logger, clock, 1000,
		//"vel_cmds: L=%f R=%f (NaN means controller isn't writing commands yet)",
		//vel_cmds_[L], vel_cmds_[R]);
		//


		v_vel_ar_[i] = static_cast<s16>((servo_vel * steps_) / (2 * M_PI));
	}

	if (!pos_ids_.empty())
	{
    	sm_st.SyncWritePosEx(
			p_ids_pnt_, static_cast<u8>(pos_ids_.size()), p_pos_ar_, p_vel_ar_, p_acc_ar_);
	}
	if (!vel_ids_.empty())
	{
		sm_st.SyncWriteSpe(v_ids_pnt_, static_cast<u8>(vel_ids_.size()), v_vel_ar_, v_acc_ar_);
	}
	return hardware_interface::return_type::OK;
}

hardware_interface::CallbackReturn WaveshareServos::on_cleanup(
    const rclcpp_lifecycle::State & /*previous_state*/)
{
	sm_st.syncReadEnd();
	sm_st.end();
	delete[] p_pos_ar_;
	delete[] p_vel_ar_;
	delete[] p_acc_ar_;
	delete[] v_vel_ar_;
	delete[] v_acc_ar_;
	return hardware_interface::CallbackReturn::SUCCESS;
}

double WaveshareServos::get_position(int ID)
{
    // Flip sign for motor ID 2 so robot-frame position is negated
    double pos = sm_st.ReadPos(ID) * 2 * M_PI / steps_;
    if (ID == 2 || ID == 4) pos = -pos;
    return pos;
}

double WaveshareServos::get_velocity(int ID)
{
    // Flip sign for motor ID 2 so robot-frame velocity is negated
    double vel = sm_st.ReadSpeed(ID) * 2 * M_PI / steps_; // rads / s
    if (ID == 2 || ID == 4) vel = -vel;
    return vel;
}

double WaveshareServos::get_torque(int ID)
{
    // ReadCurrent(ID) return unitless value, multiply by static current (6mA)
    int current = sm_st.ReadCurrent(ID) * 6.0 / 1000.0;
    double torque = current * KT_;
    return torque;
}

double WaveshareServos::get_temperature(int ID)
{
    double temp = static_cast<double>(sm_st.ReadTemper(ID));
    return temp;
}

}  // namespace waveshare_servos

#include "pluginlib/class_list_macros.hpp"

PLUGINLIB_EXPORT_CLASS(
	waveshare_servos::WaveshareServos, hardware_interface::SystemInterface)
