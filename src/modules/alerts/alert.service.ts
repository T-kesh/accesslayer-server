import { prisma } from '../../utils/prisma.utils';
import { CreateAlertInput } from './alert.schemas';

/**
 * Creates a new price alert for a wallet address watching a creator's key price.
 */
export async function createAlert(input: CreateAlertInput) {
    return await prisma.priceAlert.create({
        data: {
            creatorId: input.creator_id,
            walletAddress: input.wallet_address,
            targetPrice: input.target_price,
            direction: input.direction,
            callbackUrl: input.callback_url,
        },
    });
}

/**
 * Lists all active price alerts for a given wallet address.
 */
export async function listAlerts(walletAddress: string) {
    return await prisma.priceAlert.findMany({
        where: { walletAddress, isActive: true },
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Deletes a price alert by id, scoped to the wallet address for authorization.
 * Returns the deleted record id or null if not found.
 */
export async function deleteAlert(
    id: string,
    walletAddress: string
): Promise<{ id: string } | null> {
    const existing = await prisma.priceAlert.findFirst({
        where: { id, walletAddress },
    });

    if (!existing) {
        return null;
    }

    await prisma.priceAlert.delete({ where: { id } });
    return { id };
}
