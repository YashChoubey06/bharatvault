import {
  parcels,
  villages,
  owners,
  registrations,
  mutations,
  gis,
  courtCases,
  riskScores,
  ownershipHistory,
} from "./data";

export async function getParcels() {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return parcels.map((parcel) => ({
    ...parcel,
    village: villages.find(
      (village) => village.id === parcel.villageId
    ),
    owner: owners.find(
      (owner) => owner.id === parcel.currentRecordedOwnerId
    ),
  }));
}

export async function getParcelById(parcelId) {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const parcel = parcels.find((item) => item.id === parcelId);

  if (!parcel) {
    throw new Error("Parcel not found.");
  }

  return {
    ...parcel,

    village: villages.find(
      (village) => village.id === parcel.villageId
    ),

    owner: owners.find(
      (owner) => owner.id === parcel.currentRecordedOwnerId
    ),

    registration: registrations.find(
      (item) => item.parcelId === parcelId
    ),

    mutation: mutations.find(
      (item) => item.parcelId === parcelId
    ),

    gis: gis.find(
      (item) => item.parcelId === parcelId
    ),

    courtCase: courtCases.find(
      (item) => item.parcelId === parcelId
    ),

    risk: riskScores.find(
      (item) => item.parcelId === parcelId
    ),

    ownershipHistory: ownershipHistory.find(
      (item) => item.parcelId === parcelId
    ),
  };
}

export async function searchParcels(searchTerm) {
  await new Promise((resolve) => setTimeout(resolve, 250));

  const term = searchTerm.trim().toLowerCase();

  if (!term) {
    return getParcels();
  }

  const results = parcels.filter((parcel) => {
    return (
      parcel.id.toLowerCase().includes(term) ||
      parcel.surveyNumber.toLowerCase().includes(term) ||
      parcel.khataNumber.toLowerCase().includes(term) ||
      parcel.currentRecordedOwner?.toLowerCase().includes(term)
    );
  });

  return results;
}