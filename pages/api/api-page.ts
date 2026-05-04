import { APIRequestContext, APIResponse, request } from '@playwright/test';
import { uuidv7 } from 'uuidv7';
import * as https from 'https';
import { Constants } from '@utilities/constants';
import { step } from '@utilities/logging';
import fs from 'fs';
import * as path from 'path';
import { Logger } from '@utilities/logger';

/** Default login path for open-console. */
export const LOGIN_PATH = '/api/v1/client/login';
export class APIPage {
  constructor(private requestContext?: APIRequestContext) { }

  headers: { [key: string]: string } = {
    Accept: '*/*',
  };

  port = 443;
  getMethod = 'GET';
  postMethod = 'POST';
  putMethod = 'PUT';
  deleteMethod = 'DELETE';
  patchMethod = 'PATCH';

  addAuthTokenToHeaders = (
    token: string | null | undefined,
  ): { [key: string]: string } => ({
    ...this.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  });
  loginAsSeller: ((apiPage: APIPage) => Promise<APIResponse>) | undefined;

  baseUrl?: string;

  /**
 * Retrieves the base hostname used for API requests.
 *
 * This method returns the explicitly assigned `baseUrl` if available;
 * otherwise, it falls back to the default value defined in {@link Constants.BASE_API_URL}.
 *
 * It ensures a consistent and centralized way to resolve the base API endpoint
 * across all requests in the APIPage.
 *
 * @returns The base hostname as a string (e.g., "https://api.example.com")
 *
 * @example
 * this.baseUrl = "https://custom-api.com";
 * getBaseHostname(); // returns "https://custom-api.com"
 *
 * @example
 * this.baseUrl = undefined;
 * getBaseHostname(); // returns Constants.BASE_API_URL
 */
  protected getBaseHostname(): string {
    return this.baseUrl || Constants.BASE_API_URL;
  }

  /**
   * Build seller API path
   * @param path API endpoint
   * @returns Full seller API path
   */
  sellerPath(
    path: string,
    params?: Record<string, string | number | boolean>,
  ): string {
    const p = path.startsWith('/') ? path : '/' + path;

    if (!params) return p;

    return (
      p +
      '?' +
      new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).map(([k, v]) => [k, String(v)]),
        ),
      ).toString()
    );
  }

  /** Build path for open-console API (path + optional query params). */
  openConsolePath(
    path: string,
    params?: Record<string, string | number | boolean>,
  ): string {
    const p = '/open-console' + (path.startsWith('/') ? path : '/' + path);
    if (!params) return p;
    return (
      p +
      '?' +
      new URLSearchParams(
        Object.fromEntries(
          Object.entries(params).map(([k, v]) => [k, String(v)]),
        ),
      ).toString()
    );
  }

  /**
   * Validate Base URL
   * @param url
   */
  private validateBaseUrl(url: string): void {
    try {
      new URL(url);
    } catch (e) {
      throw new Error(`Invalid BASE_API_URL: '${url}' with error '${e}`, { cause: e });
    }
  }

  /**
   * Generates a human-readable timestamp string for use as a trace ID suffix.
   * Format: `YYYYMMDD-HHmmss-mmm` (local time)
   *
   * Combined with uuidv7() this gives you a trace_id that is both:
   * - Globally unique & time-sortable (uuidv7 part)
   * - Immediately readable in logs without decoding (season ID part)
   *
   * Example: `018e8b3a-7c4d-7a1b-9f23-4e5d6a7b8c9d_20260328-154258-123`
   */
  private generateSeasonId(): string {
    const now = new Date();
    const pad = (n: number, len = 2): string => String(n).padStart(len, '0');
    return [
      `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`,
      `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`,
      pad(now.getMilliseconds(), 3),
    ].join('-');
  }

  /**
   * Normalize Base URL
   * @param hostname
   * @param port
   * @returns
   */
  private normalizeBaseUrl(hostname: string, port: number): string {
    if (hostname.startsWith('http://') || hostname.startsWith('https://')) {
      return hostname;
    }
    const protocol = port === 443 ? 'https' : 'http';
    return `${protocol}://${hostname}`;
  }
  /**
   * Makes an asynchronous request to the specified path with the given options.
   *
   * @param { string } path - The path to append to the base API URL.
   * @param { string } method - The HTTP method(GET, POST, PUT, DELETE).
   * @param { any } [requestBody] - The body of the request, if applicable.
   * @returns { Promise<any> } - A promise that resolves to the JSON - parsed response body.
   */
  private async apiRequest(
    path: string,
    method: string,
    requestBody?: any,
  ): Promise<APIResponse> {
    path = path.startsWith('/') ? path : `/${path}`;
    // Auto-inject __trace_id for every request so each call is individually traceable in server logs.
    // Format: `{uuidv7}_{YYYYMMDD-HHmmss-mmm}`
    //   - uuidv7 part  -> globally unique, ms-precision timestamp encoded in hex (machine-friendly)
    //   - season ID -> same timestamp in plain text (human-readable at a glance in logs)
    const traceId = `${uuidv7()}_${this.generateSeasonId()}`;
    path += (path.includes('?') ? '&' : '?') + `__trace_id=${traceId}`;
    const rawBase = this.normalizeBaseUrl(this.getBaseHostname(), this.port).replace(/\/$/, '');
    const baseURL =
      this.port === 443 || this.port === 80
        ? rawBase
        : `${rawBase}:${this.port}`;
    this.validateBaseUrl(baseURL);

    Logger.log(`Making ${method} request to: ${baseURL}${path}`);

    const context: APIRequestContext = this.requestContext || await request.newContext({
      baseURL,
      extraHTTPHeaders: this.headers,
      ignoreHTTPSErrors: true,
    });
    const options = (requestBody && (requestBody.data || requestBody.form || requestBody.multipart))
      ? requestBody
      : { data: requestBody };

    try {
      const response = await context.fetch(`${baseURL}${path}`, {
        method,
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      });
      return response;
    } catch (error: unknown) {
      Logger.error(`Error making ${method} request:`, error);
      throw new Error(`Failed to make ${method} request`, { cause: error });
    }
  }

  /**
   * Makes an asynchronous POST request to the specified path with the given request body.
   *
   * @param {string} path - The optional path to append to the base API URL.
   * @param {any} requestBody - The body of the POST request.
   * @param {string} token - Authen of the POST request.
   * @returns {Promise<any>} - A promise that resolves to the JSON-parsed response body.
   */
  @step(
    'Makes an asynchronous POST request to the specified path with the given request body.',
  )
  async apiPostRequest<T = unknown>(
    path: string,
    token?: string,
    requestBody?: T,
  ): Promise<APIResponse> {
    if (token) {
      this.headers = this.addAuthTokenToHeaders(token);
    }
    if (requestBody) {
      Logger.log(
        'apiPostRequest',
        `${this.getBaseHostname()}${path}`,
      );
    } else {
      Logger.log('apiPostRequest', `${this.getBaseHostname()}${path}`);
    }
    return await this.apiRequest(path, this.postMethod, requestBody);
  }

  /**
   * Makes an asynchronous GET request to the specified path.
   *
   * @param {string} path - The optional path to append to the base API URL.
   * @param {string} token - Authen of the GET request.
   * @returns {Promise<any>} - A promise that resolves to the JSON-parsed response body.
   */
  @step('Makes an asynchronous GET request to the specified path.')
  async apiGetRequest(path: string = '', token?: string): Promise<APIResponse> {
    if (token) {
      this.headers = this.addAuthTokenToHeaders(token);
    }
    Logger.log('apiGetRequest', this.getBaseHostname(), path);
    return await this.apiRequest(path, this.getMethod);
  }

  /**
   * Makes an asynchronous PUT request to the specified path with the given request body.
   *
   * @param {string} path - The optional path to append to the base API URL.
   * @param {any} requestBody - The body of the PUT request.
   * @param {string} token - Authen of the PUT request.
   * @returns {Promise<any>} - A promise that resolves to the JSON-parsed response body.
   */
  @step(
    'Makes an asynchronous PUT request to the specified path with the given request body.',
  )
  async apiPutRequest<T = unknown>(
    path: string,
    token?: string,
    requestBody?: T,
  ): Promise<APIResponse> {
    if (token) {
      this.headers = this.addAuthTokenToHeaders(token);
    }
    if (requestBody) {
      Logger.log(
        'apiPutRequest',
        `${this.getBaseHostname()}${path}`,
      );
    } else {
      Logger.log('apiPutRequest', `${this.getBaseHostname()}${path}`);
    }
    return await this.apiRequest(path, this.putMethod, requestBody);
  }

  /**
   * Makes an asynchronous DELETE request to the specified path.
   *
   * @param {string} path - The optional path to append to the base API URL.
   * @param {string} token - Authen of the DELETE request.
   * @returns {Promise<any>} - A promise that resolves to the JSON-parsed response body.
   */
  @step('Makes an asynchronous DELETE request to the specified path.')
  async apiDeleteRequest<T = unknown>(
    path: string,
    token?: string,
    requestBody?: T,
  ): Promise<APIResponse> {
    if (token) {
      this.headers = this.addAuthTokenToHeaders(token);
    }
    if (requestBody) {
      Logger.log(
        'apiDeleteRequest',
        `${this.getBaseHostname()}${path}`,
      );
    } else {
      Logger.log('apiDeleteRequest', `${this.getBaseHostname()}${path}`);
    }
    return await this.apiRequest(path, this.deleteMethod, requestBody);
  }

  /**
   * Makes an asynchronous PATCH request to the specified path with the given request body.
   *
   * @param {string} path - The optional path to append to the base API URL.
   * @param {string} token - Authen of the PATCH request.
   * @param {any} requestBody - The body of the PUT request.
   * @returns {Promise<any>} - A promise that resolves to the JSON-parsed response body.
   */
  @step(
    'Makes an asynchronous PATCH request to the specified path with the given request body.',
  )
  async apiPatchRequest<T = unknown>(
    path: string,
    token?: string,
    requestBody?: T,
  ): Promise<APIResponse> {
    if (token) {
      this.headers = this.addAuthTokenToHeaders(token);
    }
    if (requestBody) {
      Logger.log(
        'apiPatchRequest',
        `${this.getBaseHostname()}${path}`,
      );
    } else {
      Logger.log('apiPatchRequest', `${this.getBaseHostname()}${path}`);
    }
    return await this.apiRequest(path, this.patchMethod, requestBody);
  }

  /**
   * Makes an asynchronous GET request to download file.
   * @param endpoint
   * @param filePath
   */
  @step('Makes an asynchronous GET request to download file.')
  async downloadFile(endpoint: string): Promise<string> {
    const url = `https://${this.getBaseHostname()}${endpoint}`;
    return new Promise((resolve, reject) => {
      https
        .get(url, (res) => {
          // Extract filename from headers or URL
          let fileName: string;

          // Try to get file name from Content-Disposition header
          const disposition = res.headers['content-disposition'];
          if (disposition) {
            const regex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const match = regex.exec(disposition);
            fileName = match?.[1]?.replace(/['"]/g, '') ?? 'default_file_name';
          } else {
            // Fallback to extracting from the URL
            fileName = path.basename(new URL(url).pathname);
          }

          const fullPath = `${__dirname}/${Constants.DOWNLOAD_FOLDER}/${fileName}`;
          const file = fs.createWriteStream(fullPath);

          res.pipe(file);

          file.on('finish', () => {
            file.close();
            Logger.log(`Download Completed: ${fileName}`);
            resolve(fileName); // Return the downloaded file name
          });

          file.on('error', (err) => {
            fs.unlinkSync(fullPath); // Delete the file on error
            reject(new Error(`File download failed: ${err.message}`));
          });
        })
        .on('error', (err) => {
          reject(new Error(`Request failed: ${err.message}`));
        });
    });
  }
}
