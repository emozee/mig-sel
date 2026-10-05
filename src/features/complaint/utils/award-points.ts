import { supabase } from '@/lib/supabase';
import type { ComplaintStatus } from '@/features/complaint/types';

const POINTS: Record<ComplaintStatus, { master: number; child: number }> = {
  pending: { master: 1, child: 1 },
  'in-progress': { master: 2, child: 1 },
  resolved: { master: 4, child: 2 },
  public: { master: 1, child: 1 },
};

function getPoints(status: ComplaintStatus, isChild: boolean): number {
  const p = POINTS[status];
  return isChild ? p.child : p.master;
}

export async function awardPointsForStatus(
  reporterId: string | null | undefined,
  grievanceId: string,
  oldStatus: ComplaintStatus | null,
  newStatus: ComplaintStatus,
  isChild = false,
): Promise<void> {
  if (!reporterId || !oldStatus || oldStatus === newStatus) return;

  const delta = getPoints(newStatus, isChild) - getPoints(oldStatus, isChild);

  const { error } = await supabase.rpc('adjust_points', {
    p_reporter_id: reporterId,
    p_grievance_id: grievanceId,
    p_delta: delta,
    p_new_value: getPoints(newStatus, isChild),
  });

  if (error) throw error;
}

export async function awardPointsForSubmission(
  reporterId: string | null | undefined,
  grievanceId?: string,
): Promise<void> {
  if (!reporterId || !grievanceId) return;
  const { error } = await supabase.rpc('award_shop_submission_points', {
    p_grievance_id: grievanceId,
  });
  if (error) throw error;
}

export async function revokeChildPoints(
  reporterId: string,
  grievanceId: string,
  currentBonusAwarded: number,
): Promise<void> {
  if (currentBonusAwarded <= 0) return;

  const { error } = await supabase.rpc('adjust_points', {
    p_reporter_id: reporterId,
    p_grievance_id: grievanceId,
    p_delta: -currentBonusAwarded,
    p_new_value: 0,
  });

  if (error) throw error;
}

export async function restoreMasterPoints(
  reporterId: string,
  grievanceId: string,
  status: ComplaintStatus,
  currentBonusAwarded: number,
): Promise<void> {
  const newValue = getPoints(status, false);
  const delta = newValue - currentBonusAwarded;

  if (delta === 0) return;

  const { error } = await supabase.rpc('adjust_points', {
    p_reporter_id: reporterId,
    p_grievance_id: grievanceId,
    p_delta: delta,
    p_new_value: newValue,
  });

  if (error) throw error;
}
