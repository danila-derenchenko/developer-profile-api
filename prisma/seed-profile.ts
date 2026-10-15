import type { PrismaClient } from './client/client.js';
import { profileData } from './profile-data.js';
import type { ProfileData } from './profile-data.js';

export async function seedProfile(prisma: PrismaClient, data: ProfileData = profileData) {
  const { links, skills, experience, projects, ...profile } = data;

  return prisma.$transaction(async (tx) => {
    const owner = await tx.profile.upsert({
      where: { slug: 'owner' },
      create: { slug: 'owner', ...profile },
      update: profile,
    });
    const profileId = owner.id;
    const linkIds: number[] = [];
    const skillIds: number[] = [];
    const experienceIds: number[] = [];
    const projectIds: number[] = [];

    for (const [order, link] of links.entries()) {
      const row = await tx.professionalLink.upsert({
        where: { profileId_url: { profileId, url: link.url } },
        create: { profileId, order, ...link },
        update: { order, ...link },
      });
      linkIds.push(row.id);
    }
    for (const [order, skill] of skills.entries()) {
      const row = await tx.skill.upsert({
        where: { profileId_name: { profileId, name: skill.name } },
        create: { profileId, order, ...skill },
        update: { order, ...skill },
      });
      skillIds.push(row.id);
    }
    for (const [order, job] of experience.entries()) {
      const values = {
        ...job,
        order,
        startDate: new Date(job.startDate),
        endDate: job.endDate ? new Date(job.endDate) : null,
      };
      const row = await tx.experience.upsert({
        where: {
          profileId_company_position_startDate: {
            profileId, company: job.company, position: job.position, startDate: values.startDate,
          },
        },
        create: { profileId, ...values },
        update: values,
      });
      experienceIds.push(row.id);
    }
    for (const [order, project] of projects.entries()) {
      const row = await tx.project.upsert({
        where: { profileId_url: { profileId, url: project.url } },
        create: { profileId, order, ...project },
        update: { order, ...project },
      });
      projectIds.push(row.id);
    }

    await tx.professionalLink.deleteMany({ where: { profileId, id: { notIn: linkIds } } });
    await tx.skill.deleteMany({ where: { profileId, id: { notIn: skillIds } } });
    await tx.experience.deleteMany({ where: { profileId, id: { notIn: experienceIds } } });
    await tx.project.deleteMany({ where: { profileId, id: { notIn: projectIds } } });
    return owner;
  });
}
