import { z } from 'zod';
import { ConnectedAccountDtoSchema } from './ConnectedAccountDto';

export const ListConnectionsResponseSchema = z.array(ConnectedAccountDtoSchema);
export type ListConnectionsResponse = z.infer<typeof ListConnectionsResponseSchema>;
