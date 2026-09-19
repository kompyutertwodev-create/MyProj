import { describe, it, expect } from 'vitest';
import { resolvePath, evaluateCondition, type AttributeCondition } from '../AttributeCondition.js';

describe('AttributeCondition', () => {
  describe('resolvePath', () => {
    it('returns value for simple path', () => {
      const obj = { name: 'test' };
      const result = resolvePath(obj, 'name');

      expect(result).toBe('test');
    });

    it('returns value for nested path', () => {
      const obj = { user: { id: '123' } };
      const result = resolvePath(obj, 'user.id');

      expect(result).toBe('123');
    });

    it('returns undefined for missing path', () => {
      const obj = { user: { id: '123' } };
      const result = resolvePath(obj, 'user.name');

      expect(result).toBe(undefined);
    });

    it('returns undefined for null intermediate', () => {
      const obj = { user: null };
      const result = resolvePath(obj, 'user.id');

      expect(result).toBe(undefined);
    });

    it('returns undefined for undefined intermediate', () => {
      const obj = { user: undefined };
      const result = resolvePath(obj, 'user.id');

      expect(result).toBe(undefined);
    });

    it('returns undefined for non-object intermediate', () => {
      const obj = { user: 'string' };
      const result = resolvePath(obj, 'user.id');

      expect(result).toBe(undefined);
    });
  });

  describe('evaluateCondition', () => {
    it('eq operator passes when equal', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.ownerId',
        operator: 'eq',
        value: 'user-123',
      };
      const context = { resource: { ownerId: 'user-123' } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(true);
    });

    it('eq operator fails when not equal', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.ownerId',
        operator: 'eq',
        value: 'user-123',
      };
      const context = { resource: { ownerId: 'user-456' } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(false);
    });

    it('neq operator passes when not equal', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.ownerId',
        operator: 'neq',
        value: 'user-123',
      };
      const context = { resource: { ownerId: 'user-456' } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(true);
    });

    it('neq operator fails when equal', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.ownerId',
        operator: 'neq',
        value: 'user-123',
      };
      const context = { resource: { ownerId: 'user-123' } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(false);
    });

    it('in operator passes when value in array', () => {
      const condition: AttributeCondition = {
        attribute: 'subject.tier',
        operator: 'in',
        value: ['premium', 'enterprise'],
      };
      const context = { subject: { tier: 'premium' } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(true);
    });

    it('in operator fails when value not in array', () => {
      const condition: AttributeCondition = {
        attribute: 'subject.tier',
        operator: 'in',
        value: ['premium', 'enterprise'],
      };
      const context = { subject: { tier: 'free' } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(false);
    });

    it('in operator fails when value is not array', () => {
      const condition: AttributeCondition = {
        attribute: 'subject.tier',
        operator: 'in',
        value: 'premium',
      };
      const context = { subject: { tier: 'premium' } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(false);
    });

    it('nin operator passes when value not in array', () => {
      const condition: AttributeCondition = {
        attribute: 'subject.tier',
        operator: 'nin',
        value: ['premium', 'enterprise'],
      };
      const context = { subject: { tier: 'free' } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(true);
    });

    it('nin operator fails when value in array', () => {
      const condition: AttributeCondition = {
        attribute: 'subject.tier',
        operator: 'nin',
        value: ['premium', 'enterprise'],
      };
      const context = { subject: { tier: 'premium' } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(false);
    });

    it('gt operator passes when greater', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.count',
        operator: 'gt',
        value: 10,
      };
      const context = { resource: { count: 15 } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(true);
    });

    it('gt operator fails when not greater', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.count',
        operator: 'gt',
        value: 10,
      };
      const context = { resource: { count: 10 } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(false);
    });

    it('gte operator passes when greater or equal', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.count',
        operator: 'gte',
        value: 10,
      };
      const context = { resource: { count: 10 } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(true);
    });

    it('gte operator fails when less', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.count',
        operator: 'gte',
        value: 10,
      };
      const context = { resource: { count: 5 } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(false);
    });

    it('lt operator passes when less', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.count',
        operator: 'lt',
        value: 10,
      };
      const context = { resource: { count: 5 } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(true);
    });

    it('lt operator fails when not less', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.count',
        operator: 'lt',
        value: 10,
      };
      const context = { resource: { count: 10 } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(false);
    });

    it('lte operator passes when less or equal', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.count',
        operator: 'lte',
        value: 10,
      };
      const context = { resource: { count: 10 } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(true);
    });

    it('lte operator fails when greater', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.count',
        operator: 'lte',
        value: 10,
      };
      const context = { resource: { count: 15 } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(false);
    });

    it('contains operator passes when substring', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.name',
        operator: 'contains',
        value: 'test',
      };
      const context = { resource: { name: 'this is a test' } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(true);
    });

    it('contains operator fails when not substring', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.name',
        operator: 'contains',
        value: 'test',
      };
      const context = { resource: { name: 'this is sample' } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(false);
    });

    it('startsWith operator passes when prefix', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.name',
        operator: 'startsWith',
        value: 'test',
      };
      const context = { resource: { name: 'test string' } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(true);
    });

    it('startsWith operator fails when not prefix', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.name',
        operator: 'startsWith',
        value: 'test',
      };
      const context = { resource: { name: 'sample test' } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(false);
    });

    it('exists operator passes when value exists', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.ownerId',
        operator: 'exists',
        value: null,
      };
      const context = { resource: { ownerId: 'user-123' } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(true);
    });

    it('exists operator fails when value is undefined', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.ownerId',
        operator: 'exists',
        value: null,
      };
      const context = { resource: {} };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(false);
    });

    it('exists operator fails when value is null', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.ownerId',
        operator: 'exists',
        value: null,
      };
      const context = { resource: { ownerId: null } };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(false);
    });

    it('resolves dynamic reference', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.ownerId',
        operator: 'eq',
        value: '${subject.id}',
      };
      const context = {
        subject: { id: 'user-123' },
        resource: { ownerId: 'user-123' },
      };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(true);
    });

    it('dynamic reference resolves to different path', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.ownerId',
        operator: 'eq',
        value: '${subject.managerId}',
      };
      const context = {
        subject: { id: 'user-123', managerId: 'user-456' },
        resource: { ownerId: 'user-456' },
      };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(true);
    });

    it('returns false for missing actual value with eq', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.ownerId',
        operator: 'eq',
        value: 'user-123',
      };
      const context = { resource: {} };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(false);
    });

    it('handles missing actual value with exists', () => {
      const condition: AttributeCondition = {
        attribute: 'resource.ownerId',
        operator: 'exists',
        value: null,
      };
      const context = { resource: {} };

      const result = evaluateCondition(condition, context);

      expect(result).toBe(false);
    });
  });
});
