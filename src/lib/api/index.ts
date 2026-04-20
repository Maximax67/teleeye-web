export { ApiError } from './error';
export type { RequestOptions } from './client';

import { WebhooksApi } from './modules/webhooks';

class APIClient extends WebhooksApi { }

export const apiClient = new APIClient();
