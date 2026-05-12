export type ApiError = {
  message: string;
  code?: string;
  details?: unknown;
};

export type ApiEnvelope<T> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: ApiError;
    };
