export function alignOffset(offset: number, alignment: number): number {
	return offset + ((alignment - (offset % alignment)) % alignment);
}
