/**
 * Base class for value objects.
 * Equality is structural: two VOs are equal iff all their properties are equal.
 */
export abstract class ValueObject<TProps extends object = Record<string, unknown>> {
  protected readonly props: Readonly<TProps>;

  protected constructor(props: TProps) {
    this.props = Object.freeze({ ...props });
  }

  equals(other: ValueObject<TProps>): boolean {
    if (other === this) return true;
    if (other.constructor !== this.constructor) return false;
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }

  toString(): string {
    return JSON.stringify(this.props);
  }
}
