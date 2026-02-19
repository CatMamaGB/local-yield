/**
 * Auth types shared between server and client.
 */

import type { Role } from "@/types";
import type { PrimaryMode } from "../redirects";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  zipCode: string | null;
  primaryMode?: PrimaryMode | null;
  termsAcceptedAt?: Date | null;
  isProducer?: boolean;
  isBuyer?: boolean;
  isCaregiver?: boolean;
  isHomesteadOwner?: boolean;
}
