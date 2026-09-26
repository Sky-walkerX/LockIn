import { describe, expect, it } from "vitest";
import { poolConfig } from "./db-config";

describe("poolConfig", () => {
  it("drops Prisma-only parameters and sizes the pool from connection_limit", () => {
    const c = poolConfig("postgresql://u:p@aws-0-eu.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1");
    expect(c.connectionString).toBe("postgresql://u:p@aws-0-eu.pooler.supabase.com:6543/postgres");
    expect(c.max).toBe(1);
    expect(c.connectionTimeoutMillis).toBe(5000);
  });

  it("encrypts Supabase connections without checking the certificate, as Prisma 6 did", () => {
    expect(poolConfig("postgresql://u:p@db.abcd.supabase.co:5432/postgres").ssl).toEqual({ rejectUnauthorized: false });
    expect(poolConfig("postgresql://u:p@aws-0-eu.pooler.supabase.com:6543/postgres").ssl).toEqual({ rejectUnauthorized: false });
  });

  it("connects to other hosts as before: no SSL unless the URL asks", () => {
    expect(poolConfig("postgresql://lockin:lockin@db:5432/lockin").ssl).toBe(false);
    expect(poolConfig("postgresql://postgres:postgres@localhost:54321/lockin").ssl).toBe(false);
  });

  it("gives sslmode its libpq meaning", () => {
    expect(poolConfig("postgresql://u:p@h.example/db?sslmode=require").ssl).toEqual({ rejectUnauthorized: false });
    expect(poolConfig("postgresql://u:p@h.example/db?sslmode=verify-full").ssl).toEqual({ rejectUnauthorized: true });
    expect(poolConfig("postgresql://u:p@db.x.supabase.co/db?sslmode=disable").ssl).toBe(false);
    expect(poolConfig("postgresql://u:p@h.example/db?sslmode=require").connectionString).toBe("postgresql://u:p@h.example/db");
  });

  it("doesn't throw when there's no URL yet", () => {
    expect(poolConfig("")).toEqual({ connectionTimeoutMillis: 5000 });
  });

  it("doesn't pretend a host merely containing 'supabase' is Supabase", () => {
    expect(poolConfig("postgresql://u:p@supabase.com.evil.example/db").ssl).toBe(false);
  });
});
