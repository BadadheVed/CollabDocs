import type { IncomingHttpHeaders } from 'http';

export interface ConnectedUser {
  name: string;
  token: string;
}

export interface ConnectionContext {
  user?: ConnectedUser;
}

export interface Connection {
  token?: string;
  [key: string]: unknown;
}

export interface AuthPayload {
  documentName: string;
  requestHeaders?: IncomingHttpHeaders;
  requestParameters?: URLSearchParams;
  token?: string;
  context: ConnectionContext;
}

export interface ConnectPayload {
  documentName: string;
  context: ConnectionContext;
  connection?: Connection;
}

export interface LoadPayload {
  documentName: string;
  context: ConnectionContext;
}
