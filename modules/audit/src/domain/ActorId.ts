import { DomainError, Result, ValueObject, err, ok } from '@workspace/kernel';

interface ActorIdProps {
  value: string;
}

/**
 * Value Object: identifier of the actor that performed an audited action.
 * Typically an iam UserId, but can be a system identifier (e.g., "system").
 */
export class ActorId extends ValueObject<ActorIdProps> {
  private constructor(props: ActorIdProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(value: string): Result<ActorId, DomainError> {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return err(new DomainError('ACTOR_ID_EMPTY', 'Actor id cannot be empty'));
    }
    return ok(new ActorId({ value: trimmed }));
  }

  toString(): string {
    return this.props.value;
  }
}
