/**
 * Specification pattern — encapsulates a business rule as a first-class object.
 * Compose with and/or/not for complex rules without conditional soup.
 */
export interface Specification<T> {
  isSatisfiedBy(candidate: T): boolean;
}

export abstract class CompositeSpecification<T> implements Specification<T> {
  abstract isSatisfiedBy(candidate: T): boolean;

  and(other: Specification<T>): Specification<T> {
    return {
      isSatisfiedBy: (c: T) => this.isSatisfiedBy(c) && other.isSatisfiedBy(c),
    };
  }

  or(other: Specification<T>): Specification<T> {
    return {
      isSatisfiedBy: (c: T) => this.isSatisfiedBy(c) || other.isSatisfiedBy(c),
    };
  }

  not(): Specification<T> {
    return { isSatisfiedBy: (c: T) => !this.isSatisfiedBy(c) };
  }
}
