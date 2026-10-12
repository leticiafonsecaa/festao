import { describe, expect, it } from 'vitest';
import {
  formatBRL,
  getCountdown,
  normalizeName,
  parsePrice,
  safeHex,
  slugify,
  timeAgo,
} from './eventUtils';

describe('slugify', () => {
  it('normaliza acentos, espaços e caixa para slugs de evento', () => {
    expect(slugify('Casamento de Ana & Lucas')).toBe('casamento-de-ana-lucas');
    expect(slugify('Festa de 15 anos da Júlia!')).toBe('festa-de-15-anos-da-julia');
    expect(slugify('   ')).toBe('');
  });
});

describe('normalizeName', () => {
  it('equipara nomes com acentos, caixa e espaços para o match de RSVP', () => {
    expect(normalizeName('Maria Silva')).toBe(normalizeName('maria silva'));
    expect(normalizeName('José  D’Ávila ')).toBe('jose d’avila');
  });
});

describe('safeHex', () => {
  it('aceita apenas #RRGGBB válido e devolve o fallback', () => {
    expect(safeHex('#C47D6B', '#000000')).toBe('#C47D6B');
    expect(safeHex('#c47d6b', '#000000')).toBe('#c47d6b');
    expect(safeHex('red', '#000000')).toBe('#000000');
    expect(safeHex('#12345', '#000000')).toBe('#000000');
    expect(safeHex('#12345G', '#000000')).toBe('#000000');
  });
});

describe('parsePrice/formatBRL', () => {
  it('entende formatos brasileiros de preço', () => {
    expect(parsePrice('R$ 1.299,90')).toBeCloseTo(1299.9);
    expect(parsePrice('1299,9')).toBeCloseTo(1299.9);
    expect(parsePrice('1299.90')).toBeCloseTo(1299.9);
    expect(parsePrice('')).toBeNaN();
  });

  it('formata valores em BRL', () => {
    expect(formatBRL(1299.9)).toContain('1.299,90');
  });
});

describe('getCountdown', () => {
  it('retorna futuro/hoje/passado conforme a data', () => {
    expect(getCountdown('', undefined, new Date('2026-01-01T10:00:00'))).toEqual({
      status: 'past',
      days: 0,
      hours: 0,
      minutes: 0,
    });
    const future = getCountdown('2026-01-03', '10:00', new Date('2026-01-01T10:00:00'));
    expect(future.status).toBe('future');
    expect(future.days).toBe(2);
    expect(getCountdown('2026-01-01', '09:00', new Date('2026-01-01T23:00:00')).status).toBe(
      'today'
    );
  });
});

describe('timeAgo', () => {
  it('descreve intervalos relativos em pt-BR', () => {
    expect(timeAgo(undefined)).toBe('');
    expect(timeAgo('invalida')).toBe('');
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    expect(timeAgo(twoMinutesAgo)).toBe('há 2 min');
  });
});
