/**
 * Notification system abstraction.
 * Creates in-app notifications and can send emails (stub for now).
 */

import { prisma } from "@/lib/prisma";
import type { CreateNotificationInput } from "./types";
import type { Notification } from "@prisma/client";

/**
 * Create an in-app notification.
 */
export async function createNotification(input: CreateNotificationInput): Promise<Notification> {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
      read: false,
    },
  });
}

/**
 * Send an email notification (stub for now).
 * In production, integrate with SendGrid, Twilio, or similar.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    // TODO: Integrate with email service
    console.log("[email-stub]", JSON.stringify(input));
  } else {
    console.log("[email-stub]", JSON.stringify(input));
  }
}
