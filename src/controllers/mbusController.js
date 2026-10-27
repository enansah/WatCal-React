const axios = require('axios');
const parseString = require('xml2js').parseString;
const Reading = require('../models/Reading');
const { energyKwh, recordReading } = require('../../utils/meters');

// Reads an M-Bus XML document (as produced by libmbus / the meter gateway) into plain values
function parseMBusXml(xml) {
    return new Promise((resolve, reject) => {
        parseString(xml, (err, result) => {
            if (err) return reject(err);
            try {
                const slaveInfo = result.MBusData.SlaveInformation[0];
                const first = (v) => (Array.isArray(v) ? v[0] : v);
                resolve({
                    id: String(first(slaveInfo.Id)).trim(),
                    manufacturer: first(slaveInfo.Manufacturer),
                    version: first(slaveInfo.Version),
                    productName: first(slaveInfo.ProductName),
                    medium: first(slaveInfo.Medium),
                    accessNumber: first(slaveInfo.AccessNumber),
                    status: first(slaveInfo.Status),
                    signature: first(slaveInfo.Signature),
                    dataRecords: (result.MBusData.DataRecord || []).map((record) => ({
                        function: first(record.Function),
                        storageNumber: first(record.StorageNumber),
                        tariff: record.Tariff ? first(record.Tariff) : null,
                        device: record.Device ? first(record.Device) : null,
                        unit: String(first(record.Unit) || '').trim(),
                        quantity: record.Quantity ? String(first(record.Quantity)).trim() : null,
                        value: parseFloat(first(record.Value)),
                    })),
                });
            } catch (shapeError) {
                reject(new Error('Not an MBusData document'));
            }
        });
    });
}

/**
 * Keep the raw meter data and add its energy total to the room or account using that meter.
 * Returns { meterId, kwh, linked }.
 */
async function ingestMBus(data, timestamp = new Date()) {
    await new Reading({ ...data, timestamp }).save();
    const kwh = energyKwh(data.dataRecords);
    if (kwh === null) {
        console.error(`Meter ${data.id}: no energy value found in its data`);
        return { meterId: data.id, kwh: null, linked: [] };
    }
    const { linked } = await recordReading({ meterId: data.id, kwh, timestamp });
    return { meterId: data.id, kwh, linked };
}

// Fetch one meter's XML from a gateway on the local network and store it
const parseAndSaveXML = async (url) => {
    try {
        const response = await axios.get(url, { timeout: 20000 });
        const result = await ingestMBus(await parseMBusXml(response.data));
        console.log(`Meter data from ${url} saved (meter ${result.meterId}, ${result.kwh} kWh${result.linked.length ? `, added to ${result.linked.join(', ')}` : ''})`);
    } catch (err) {
        console.error(`Failed to read meter data from ${url}: ${err.message}`);
    }
};

const readMetersSequentially = async (urls, interval, delayBetweenReadings) => {
    const processUrls = async (index) => {
        if (index >= urls.length) {
            // After all URLs are processed, wait for the interval period
            setTimeout(() => processUrls(0), Math.max(interval - (urls.length * delayBetweenReadings), 0));
            return;
        }

        // Wait for the XML parsing and saving to complete
        await parseAndSaveXML(urls[index]);

        // Delay before processing the next URL
        setTimeout(() => processUrls(index + 1), delayBetweenReadings);
    };

    // Start processing URLs
    processUrls(0);
};


module.exports = {
    parseMBusXml,
    ingestMBus,
    parseAndSaveXML,
    readMetersSequentially
};
