import { Prisma } from '@prisma/client';
import { prisma } from '../../utils/prisma.utils';
import { CreatorHoldersQueryType } from './creator-holders.schemas';

/**
 * Public-facing holder record returned by the holders endpoint.
 */
export interface HolderRecord {
  wallet_address: string;
  key_balance: number;
  held_since: Date;
}

/**
 * Look up a creator profile by cuid id or handle.
 * Returns null if no creator matches either field.
 */
export async function findCreatorByIdOrHandle(
  idOrHandle: string,
): Promise<{ id: string; handle: string } | null> {
  return prisma.creatorProfile.findFirst({
    where: {
      OR: [{ id: idOrHandle }, { handle: idOrHandle }],
    },
    select: { id: true, handle: true },
  });
}

/**
 * Fetch a paginated, sorted list of key holders for a creator.
 *
 * - Default sort: largest balance first (key_balance desc)
 * - sort=held_since: earliest buyer first (createdAt asc)
 * - Only returns records with balance > 0 (excludes wallets that sold all keys)
 * - held_since is derived from KeyOwnership.createdAt, which is set when the
 *   ownership row is first created (i.e. the wallet's first buy for this creator)
 *
 * @param creatorId - The creator's cuid from CreatorProfile
 * @param query     - Validated query params (limit, offset, sort)
 * @returns Tuple of [holder records, total count]
 */
export async function fetchCreatorHolders(
  creatorId: string,
  query: CreatorHoldersQueryType,
): Promise<[HolderRecord[], number]> {
  const { limit, offset, sort } = query;

  const where: Prisma.KeyOwnershipWhereInput = {
    creatorId,
    balance: { gt: 0 },
  };

  const orderBy: Prisma.KeyOwnershipOrderByWithRelationInput =
    sort === 'held_since'
      ? { createdAt: 'asc' }
      : { balance: 'desc' };

  const [rows, total] = await Promise.all([
    prisma.keyOwnership.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      select: {
        ownerAddress: true,
        balance: true,
        createdAt: true,
      },
    }),
    prisma.keyOwnership.count({ where }),
  ]);

  const holders: HolderRecord[] = rows.map((row) => ({
    wallet_address: row.ownerAddress,
    key_balance: Number(row.balance),
    held_since: row.createdAt,
  }));

  return [holders, total];
}
