export abstract class Formatter {
	public abstract format(value: number): string;
}

/**
 * {@link DecimalUnitFormatter} provides an implementation of {@link Formatter}
 * that outputs a integers in a standard decimal format with grouped thousands.
 */
export class DecimalUnitFormatter extends Formatter {
	private unit: string;
	private numberFormat: Intl.NumberFormat;

	/**
	 * @param unit the unit of the value being formatted.
	 * @constructor
	 */
	constructor(unit: string) {
		super()
		this.unit = unit;
		this.numberFormat = Intl.NumberFormat('en-US', { style: 'decimal' });
	}

	public format(value: number): string {
		return `${this.numberFormat.format(value)} ${this.unit}`
	}
}

/**
 * {@link ScalingUnitFormatter}
 */
export abstract class ScalingUnitFormatter extends Formatter {

	private numberFormat: Intl.NumberFormat;

	/**
	 * @param numberFormat An instance of {@link Intl.NumberFormat} to use to
	 * format the scaled value.
	 */
	constructor(numberFormat: Intl.NumberFormat) {
		super();
		this.numberFormat = numberFormat;
	}

	/**
	 * Scales the passed raw value (in a base unit) to an appropriate value for
	 * presentation and returns the scaled value as well as the name of the unit
	 * that the returned value is in.
	 *
	 * @param value the value to be scaled.
	 *
	 * @returns {number,string} an array-like containing the numerical value and
	 * the name of the unit that the value represents.
	 */
	protected abstract scale(value: number): [number, string];

	public format(value: number): string {
		let [scaledValue, scaledUnit] = this.scale(value);
		return `${this.numberFormat.format(scaledValue)} ${scaledUnit}`
	}

}

/**
 * {@link BytesFormatter} formats values that represent a size in bytes as a
 * value in bytes, kilobytes, megabytes, gigabytes, etc.
 */
export class BytesFormatter extends ScalingUnitFormatter {

	constructor() {
		super(Intl.NumberFormat('en-US', { style: 'decimal',
										   minimumFractionDigits: 2,
										   maximumFractionDigits: 2 }));
	}

	protected scale(value: number)	: [number, string] {
		let units = ["bytes", "KB", "MB", "GB", "TB", "PB"]
		while (value > 1024 && units.length > 0) {
			value = value / 1024
			units.shift();
		}
		return [value, units[0]];
	}
}
