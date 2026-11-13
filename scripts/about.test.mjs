import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fullYearsSince, careerStart, yearRange, meritValue, journey } from '../src/lib/about.mjs';

test('años completos de experiencia', () => {
  assert.equal(fullYearsSince('2024-11', new Date(Date.UTC(2026, 10, 13))), 2);  // nov 2026
  assert.equal(fullYearsSince('2024-11', new Date(Date.UTC(2026, 9, 31))), 1);   // oct 2026: aún no son 2
  assert.equal(fullYearsSince('2030-01', new Date(Date.UTC(2026, 0, 1))), 0);    // nunca negativo
});

test('inicio de la carrera = cargo más antiguo', () => {
  assert.equal(careerStart([{ inicio: '2026-08' }, { inicio: '2024-11' }, { inicio: '2025-02' }]), '2024-11');
});

test('rangos de años', () => {
  assert.equal(yearRange('2024-11', '2025-02', 'Presente'), '2024 – 2025');
  assert.equal(yearRange('2025-02', '2025-11', 'Presente'), '2025');
  assert.equal(yearRange('2026-08', null, 'Present'), '2026 – Present');
});

test('mérito sin prefijo', () => {
  assert.equal(meritValue('Orden de mérito: Quinto Superior'), 'Quinto Superior');
  assert.equal(meritValue('Top 20% of class'), 'Top 20% of class');
});

test('línea de tiempo ordenada, con el cargo actual marcado', () => {
  const cv = {
    experiencia: [
      { inicio: '2026-08', fin: null, cargo: 'A', empresa: 'X' },
      { inicio: '2024-11', fin: '2025-02', cargo: 'B', empresa: 'Y' },
    ],
    educacion: [{ inicio: '2022-04', fin: '2026-12', titulo: 'Ing.', institucion: 'U', nota: 'egreso previsto' }],
  };
  const j = journey(cv, 'Presente');
  assert.deepEqual(j.map((x) => x.title), ['A', 'B', 'Ing.']);
  assert.equal(j[0].now, true);
  assert.equal(j[2].org, 'U · egreso previsto');
});
