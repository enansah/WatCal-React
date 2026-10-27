// controllers/RedirectController.js
const Landlord = require('../models/Landlord');
const { buildInsights, buildPersonalInsights } = require('../../utils/usageInsights');

const NO_MATCH = "Those IDs don't match a room. Check the Landlord ID and Tenant ID with your landlord.";
// Tips about the tenant's own meter. Comparisons with other rooms and tariff-band advice (which depends on
// the whole building) are left out.
const TENANT_TIP_KINDS = new Set(['no-readings', 'offline', 'spike', 'peak', 'change']);
const RECENT_READINGS = 10;

// POST /api/viewTenant { landlordId, tenantId }: the tenant's view-only dashboard ("View your bill").
// The bill share uses the same figures as the landlord's Dashboard, so both always show the same amount.
exports.getTenantData = async (req, res) => {
    const landlordId = String(req.body.landlordId || '').trim();
    const tenantId = String(req.body.tenantId || '').trim();
    if (!landlordId || !tenantId || landlordId.length > 40 || tenantId.length > 40) {
        return res.status(400).json({ success: false, message: 'Please enter both the Landlord ID and your Tenant ID.' });
    }

    try {
        const landlord = await Landlord.findOne({ uniqueId: landlordId })
            .select('roomIds')
            .populate({ path: 'roomIds', select: 'roomNumber uniqueRoomId meterId electricityStatus readings' });
        const room = landlord && landlord.roomIds.find((r) => r.uniqueRoomId === tenantId);
        // One message whichever ID is wrong, so the form can't be used to find out which landlord IDs exist
        if (!room) {
            return res.status(404).json({ success: false, message: NO_MATCH });
        }

        const building = buildInsights(landlord.roomIds);           // for the share of the bill
        const mine = building.rooms.find((r) => String(r._id) === String(room._id));
        const own = buildPersonalInsights(room.readings);            // this room's own meter figures

        // Forecast of the room's part of the bill: its share of the building's forecast
        const b = building.building;
        const projectedBill = own.projectedUsage !== null && b.projectedUsage
            ? Number((b.projectedCost * Math.min(own.projectedUsage / b.projectedUsage, 1)).toFixed(2))
            : null;

        const tips = own.tips.filter((t) => TENANT_TIP_KINDS.has(t.kind) && !(t.kind === 'no-readings' && !room.meterId));
        if (!room.meterId) {
            tips.unshift({ level: 'info', kind: 'no-meter', text: "Your room's meter isn't connected to WatCal yet, so no readings arrive. Ask your landlord to add its meter number." });
        }
        if (room.electricityStatus === false) {
            tips.unshift({ level: 'warning', kind: 'power-off', text: 'Your landlord has switched off electricity to this room. Contact them if this is unexpected.' });
        }

        // The latest readings, newest first, with the usage since the reading before each
        const series = mine.readings.slice(-(RECENT_READINGS + 1));
        const readings = series
            .map((r, i) => ({ ...r, used: i > 0 ? Number(Math.max(0, r.readingValue - series[i - 1].readingValue).toFixed(2)) : null }))
            .slice(series.length > RECENT_READINGS ? 1 : 0)
            .reverse();

        res.json({
            success: true,
            username: room.roomNumber,
            generatedAt: building.generatedAt,
            monthStart: building.monthStart,
            room: {
                monthUsage: own.monthUsage,
                share: mine.share,                 // of all the landlord's rooms this month
                billShare: mine.billShare ?? 0,    // this room's part of this month's bill so far
                lastMonthUsage: own.lastMonthUsage,
                lastMonthSoFar: own.lastMonthSoFar,
                change: own.change,
                avgDaily: own.avgDaily,
                projectedUsage: own.projectedUsage,
                projectedBill,
                latest: mine.latest,
                previous: mine.previous,
                offline: mine.offline,
                electricityStatus: room.electricityStatus !== false,
                hasMeter: !!room.meterId,
            },
            daily: own.daily,
            monthly: own.monthly.map((m) => ({ ...m, cost: null })), // the room's own tariff cost isn't its bill
            weekday: own.weekday,
            readings,
            tips,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
