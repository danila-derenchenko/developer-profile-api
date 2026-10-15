import 'reflect-metadata';
import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../dist/src/app.module.js';
import { createPrismaClient } from '../dist/src/database/create-prisma-client.js';
import { seedProfile } from '../dist/prisma/seed-profile.js';

const fixture = {
  name: 'Test Developer',
  description: 'Integration test fixture',
  links: [{ label: 'GitHub', url: 'https://example.com/github' }],
  skills: [{ name: 'TypeScript' }, { name: 'NestJS' }],
  experience: [
    { company: 'Current', position: 'Backend Developer', startDate: '2024-01-01', endDate: null, achievements: ['Built an API'] },
    { company: 'Previous', position: 'Developer', startDate: '2022-01-01', endDate: '2023-12-31', achievements: ['Improved tests'] },
  ],
  projects: [{ name: 'Profile API', description: 'A business card', url: 'https://example.com/project' }],
};

test('fresh database, repeatable seed and real NestJS GraphQL API', { timeout: 90000 }, async (t) => {
  const originalUrl = process.env.DATABASE_URL;
  const originalDirectUrl = process.env.DATABASE_URL_UNPOOLED;
  assert.ok(originalUrl, 'Set DATABASE_URL and start PostgreSQL first');
  const databaseName = `profile_test_${randomUUID().replaceAll('-', '')}`;
  const admin = new pg.Client({ connectionString: originalUrl });
  await admin.connect();
  const url = new URL(originalUrl);
  url.pathname = `/${databaseName}`;
  let app;
  let prisma;
  try {
    await admin.query(`CREATE DATABASE "${databaseName}"`);
    process.env.DATABASE_URL = url.toString();
    process.env.DATABASE_URL_UNPOOLED = url.toString();
    execFileSync('npm', ['run', 'db:prepare'], { env: process.env, stdio: 'pipe' });
    execFileSync('npm', ['run', 'db:prepare'], { env: process.env, stdio: 'pipe' });
    prisma = createPrismaClient();
    assert.equal(await prisma.profile.count(), 1);
    await seedProfile(prisma, fixture);
    const snapshot = () => prisma.profile.findUnique({
      where: { slug: 'owner' },
      include: {
        links: { orderBy: { order: 'asc' } },
        skills: { orderBy: { order: 'asc' } },
        experience: { orderBy: { order: 'asc' } },
        projects: { orderBy: { order: 'asc' } },
      },
    });
    const beforeReseed = await snapshot();
    await seedProfile(prisma, fixture);
    assert.deepEqual(await snapshot(), beforeReseed, 'Reseeding must preserve every ID');
    assert.equal(await prisma.profile.count(), 1);
    assert.equal(await prisma.skill.count(), 2);
    assert.equal(await prisma.experience.count(), 2);
    assert.equal(await prisma.project.count(), 1);
    assert.equal(await prisma.professionalLink.count(), 1);

    await t.test('entrypoint works when Vercel defers listen until after import', () => {
      execFileSync(process.execPath, ['test/helpers/vercel-bootstrap.mjs'], {
        env: { ...process.env, VERCEL: '1' },
        stdio: 'pipe',
        timeout: 15000,
      });
    });

    app = await NestFactory.create(AppModule, { logger: false });
    await app.listen(0, '127.0.0.1');
    const endpoint = `${await app.getUrl()}/graphql`;
    const query = async (query) => {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query }),
      });
      return { status: response.status, body: await response.json() };
    };

    await t.test('assignment query and all nested fields come from PostgreSQL', async () => {
      const result = await query(`{ profile { name description links { label url } skills { name }
        experience { company position startDate endDate achievements } projects { name description url } } }`);
      assert.equal(result.status, 200);
      assert.equal(result.body.errors, undefined);
      assert.deepEqual(result.body.data.profile, {
        ...fixture,
        experience: fixture.experience.map(job => ({ ...job,
          startDate: new Date(job.startDate).toISOString(),
          endDate: job.endDate ? new Date(job.endDate).toISOString() : null,
        })),
      });
    });
    await t.test('Apollo Sandbox and schema introspection are available', async () => {
      const response = await fetch(endpoint, { headers: { accept: 'text/html' } });
      assert.equal(response.status, 200);
      assert.match(await response.text(), /apollo/i);
      assert.equal((await query('{ __schema { queryType { name } } }')).body.data.__schema.queryType.name, 'Query');
    });
    await t.test('invalid GraphQL fields are rejected', async () => {
      const result = await query('{ profile { nonexistent } }');
      assert.equal(result.status, 400);
      assert.ok(result.body.errors.length);
    });
    await t.test('updates and reordering preserve relation IDs', async () => {
      const before = await snapshot();
      await seedProfile(prisma, {
        ...fixture,
        skills: [...fixture.skills].reverse(),
        projects: [{ ...fixture.projects[0], description: 'Updated description' }],
      });
      const after = await snapshot();
      assert.deepEqual(after.skills.map(skill => skill.id), before.skills.map(skill => skill.id).reverse());
      assert.equal(after.projects[0].id, before.projects[0].id);
      assert.equal(after.projects[0].description, 'Updated description');
      await seedProfile(prisma, fixture);
    });
    await t.test('an invalid employment period rolls back the entire seed', async () => {
      const before = await snapshot();
      await assert.rejects(seedProfile(prisma, {
        ...fixture,
        name: 'Should roll back',
        skills: [{ name: 'Should roll back' }],
        experience: [{ ...fixture.experience[0], endDate: '2000-01-01' }],
      }));
      assert.deepEqual(await snapshot(), before);
    });
    await t.test('updated seed removes stale children and preserves unrelated profiles', async () => {
      await prisma.profile.create({ data: {
        slug: 'unrelated', name: 'Other',
        skills: { create: { name: 'Other skill', order: 0 } },
      } });
      await seedProfile(prisma, { ...fixture, skills: [{ name: 'GraphQL' }], experience: [], projects: [] });
      const result = await query('{ profile { skills { name } experience { company } projects { name } } }');
      assert.deepEqual(result.body.data.profile, { skills: [{ name: 'GraphQL' }], experience: [], projects: [] });
      assert.equal(await prisma.profile.count(), 2);
      assert.equal(await prisma.skill.count({ where: { name: 'Other skill' } }), 1);
    });
  } finally {
    await app?.close();
    await prisma?.$disconnect();
    process.env.DATABASE_URL = originalUrl;
    if (originalDirectUrl === undefined) delete process.env.DATABASE_URL_UNPOOLED;
    else process.env.DATABASE_URL_UNPOOLED = originalDirectUrl;
    await admin.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`);
    await admin.end();
  }
});
