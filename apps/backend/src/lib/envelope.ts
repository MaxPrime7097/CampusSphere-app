/**
 * Response envelope helpers — API_CONTRACT §1.3.
 *
 * Every endpoint returns the same shape. The Django backend mixed three
 * (`{success, data}`, bare DRF pagination, and bare objects), which is why the
 * client carries `unwrapItem` / `unwrapList` / `unwrapApiData` to paper over it.
 *
 * The list shape is `{success, data: [...], pagination}` rather than nesting the
 * array under `data.items`, because the client's `unwrapList` matches on
 * `success !== undefined && Array.isArray(data)`. Nesting would silently yield an
 * empty list in the UI instead of erroring.
 */

import type { Response } from "express";

export interface Pagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

function timestamp(): string {
  return new Date().toISOString();
}

function send<T>(res: Response, status: number, data: T, message?: string): Response {
  return res.status(status).json({
    success: true,
    data,
    ...(message ? { message } : {}),
    timestamp: timestamp(),
  });
}

/** Single-object success response. */
export function ok<T>(res: Response, data: T, message?: string): Response {
  return send(res, 200, data, message);
}

export function created<T>(res: Response, data: T, message?: string): Response {
  return send(res, 201, data, message);
}

/** Collection response. `data` is always a bare array. */
export function list<T>(res: Response, data: T[], pagination?: Pagination): Response {
  return res.status(200).json({
    success: true,
    data,
    ...(pagination ? { pagination } : {}),
    timestamp: timestamp(),
  });
}

export function noContent(res: Response): Response {
  return res.status(204).send();
}

/** Build pagination metadata. Out-of-range pages clamp rather than erroring. */
export function paginate(totalItems: number, page: number, pageSize: number): Pagination {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  return {
    page: current,
    page_size: pageSize,
    total_items: totalItems,
    total_pages: totalPages,
    has_next: current < totalPages,
    has_previous: current > 1,
  };
}

/** Parse `?page=` / `?page_size=` per API_CONTRACT §1.5. */
export function paginationParams(query: Record<string, unknown>): { page: number; pageSize: number; skip: number } {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.page_size) || 20));
  return { page, pageSize, skip: (page - 1) * pageSize };
}
