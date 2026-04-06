export function parseCdrString(cdr: Uint8Array) {
	const view = new DataView(cdr.buffer, cdr.byteOffset, cdr.byteLength);
	let offset = 0;
	offset += 4; // Skip encapsulation header
	const stringLength = view.getUint32(offset, true);
	offset += 4;
	if (stringLength === 0) {
		return "";
	}
	const stringData = new Uint8Array(
		view.buffer,
		view.byteOffset + offset,
		stringLength,
	);
	return new TextDecoder().decode(stringData);
}
