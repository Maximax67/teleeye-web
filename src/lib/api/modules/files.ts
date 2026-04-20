import { MessagesApi } from './messages';
import { ApiError } from '../error';

export class FilesApi extends MessagesApi {
  async getFile(fileUniqueId: string): Promise<Blob | null> {
    try {
      const response = await this.request<Response>(`/telegram/files/${fileUniqueId}`);
      return response.blob();
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 403)) return null;
      throw e;
    }
  }

  async getUserAvatar(userId: number): Promise<Blob | null> {
    try {
      const response = await this.request<Response>(`/telegram/users/${userId}/avatar`);
      return response.blob();
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 502)) return null;
      throw e;
    }
  }
}
