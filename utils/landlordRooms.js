// utils/landlordRooms.js
const Landlord = require('../src/models/Landlord');

// Query filter that matches only the rooms of the logged-in landlord
const landlordRoomsFilter = async (req) => {
  const landlord = await Landlord.findById(req.session.landlord._id).select('roomIds');
  return { _id: { $in: landlord ? landlord.roomIds : [] } };
};

module.exports = landlordRoomsFilter;
