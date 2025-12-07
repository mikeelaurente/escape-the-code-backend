import { Request, Response, NextFunction } from 'express';
import { getUserRankingFor } from '../../../db/repositories/user.repository';
import { getNextSectionFor } from '../../../db/repositories/story.repository';
import * as schema from '../../../db/schema';
import { eq, asc, countDistinct, sql } from 'drizzle-orm';
import { db } from '../../../db';
import {
  resolveCourseImage,
  resolveSectionAchievementImage,
} from '../../../helpers/image.helper';

export const getUserStatsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = Number(req.params.id);
    const userRank = await getUserRankingFor(userId);

    // Get the first course to fetch next section
    const firstCourse = await db.query.courses.findFirst({
      orderBy: asc(schema.courses.id),
    });

    const nextSection = firstCourse
      ? await getNextSectionFor(userId, firstCourse.id)
      : null;

    const enrolledCourses = await db
      .select({
        title: schema.courses.title,
        coverImage: schema.courses.coverImage,
        completedSections: sql<number>`(
          SELECT COUNT(DISTINCT cp.section_id)
          FROM course_progress AS cp
          WHERE cp.user_id = ${userId}
            AND cp.course_id = ${schema.courseProgress.courseId}
        )`.as('completedSections'),
        totalSections: sql<number>`(
          SELECT COUNT(*)
          FROM sections AS s
            JOIN chapters AS ch ON s.chapter_id = ch.id
          WHERE ch.course_id = ${schema.courseProgress.courseId}
        )`.as('totalSections'),
      })
      .from(schema.courses)
      .innerJoin(
        schema.courseProgress,
        eq(schema.courseProgress.courseId, schema.courses.id),
      )
      .where(eq(schema.courseProgress.userId, userId))
      .groupBy(schema.courses.id);

    enrolledCourses.map((course) => {
      course.coverImage = resolveCourseImage(course.coverImage || 'default');
    });

    const globalAchievements = await db.query.userAchievements.findMany({
      where: eq(schema.userAchievements.userId, userId),
      orderBy: asc(schema.userAchievements.awardedAt),
      with: {
        achievement: {
          columns: {
            icon: true,
            coverImage: true,
            title: true,
            description: true,
            difficulty: true,
            code: true,
          },
        },
      },
    });

    const sectionAchievements = await db.query.userSectionAchievements.findMany(
      {
        where: eq(schema.userSectionAchievements.userId, userId),
        orderBy: asc(schema.userSectionAchievements.awardedAt),
        with: {
          sectionAchievement: {
            columns: {
              id: true,
              icon: true,
              coverImage: true,
              title: true,
              description: true,
              code: true,
              rewardPoints: true,
              creditPoints: true,
            },
          },
        },
      },
    );

    // Merge achievements: map to common structure
    const achievements = [
      ...globalAchievements.map((ua) => ({
        ...ua.achievement,
        awardedAt: ua.awardedAt,
        type: 'global' as const,
        coverImage: resolveSectionAchievementImage(
          ua.achievement?.coverImage || 'default',
        ),
        title: ua.achievement?.title,
        description: ua.achievement?.description,
        icon: ua.achievement?.icon,
      })),
      ...sectionAchievements.map((usa) => ({
        ...usa.sectionAchievement,
        awardedAt: usa.awardedAt,
        type: 'section' as const,
        coverImage: resolveSectionAchievementImage(
          usa.sectionAchievement.coverImage || 'default',
        ),
        title: usa.sectionAchievement.title,
        description: usa.sectionAchievement.description,
        icon: usa.sectionAchievement.icon,
      })),
    ];

    res.json({
      status: 'ok',
      data: {
        rank: userRank,
        nextSection: nextSection,
        enrolledCourses,
        achievements,
      },
    });
  } catch (e) {
    return next(e);
  }
};
