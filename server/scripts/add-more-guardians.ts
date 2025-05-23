import { db } from "../db";
import { guardians } from "@shared/schema";

async function main() {
  console.log("Toevoegen van meer diverse voogdgegevens...");

  // Array met diverse voogdgegevens
  const guardianData = [
    {
      firstName: "Naima",
      lastName: "El Hakim",
      email: "naima.elhakim@example.com",
      phone: "0472834567",
      address: "Molenbeekstraat 28",
      city: "Antwerpen",
      postalCode: "2000",
      relationship: "moeder",
      occupation: "accountant",
      isEmergencyContact: true,
      notes: ""
    },
    {
      firstName: "Karim",
      lastName: "El Hakim",
      email: "karim.elhakim@example.com",
      phone: "0475834567",
      address: "Molenbeekstraat 28",
      city: "Antwerpen",
      postalCode: "2000",
      relationship: "vader",
      occupation: "ingenieur",
      isEmergencyContact: true,
      notes: ""
    },
    {
      firstName: "Soraya",
      lastName: "Benali",
      email: "soraya.benali@example.com",
      phone: "0472834561",
      address: "Kerkstraat 15",
      city: "Brussel",
      postalCode: "1020",
      relationship: "moeder",
      occupation: "leraar",
      isEmergencyContact: true,
      notes: ""
    },
    {
      firstName: "Mohammed",
      lastName: "Benali",
      email: "mohammed.benali@example.com",
      phone: "0472834562",
      address: "Kerkstraat 15",
      city: "Brussel",
      postalCode: "1020",
      relationship: "vader",
      occupation: "IT specialist",
      isEmergencyContact: true,
      notes: ""
    },
    {
      firstName: "Fatima",
      lastName: "El Mouden",
      email: "fatima.elmouden@example.com",
      phone: "0472836561",
      address: "Leuvenseweg 89",
      city: "Brussel",
      postalCode: "1000",
      relationship: "moeder",
      occupation: "dokter",
      isEmergencyContact: true,
      notes: ""
    },
    {
      firstName: "Ahmed",
      lastName: "El Mouden",
      email: "ahmed.elmouden@example.com",
      phone: "0472834592",
      address: "Leuvenseweg 89",
      city: "Brussel",
      postalCode: "1000",
      relationship: "vader",
      occupation: "architect",
      isEmergencyContact: true,
      notes: ""
    },
    {
      firstName: "Yasmine",
      lastName: "El Alaoui",
      email: "yasmine.elalaoui@example.com",
      phone: "0472834591",
      address: "Molenbeekstraat 45",
      city: "Brussel",
      postalCode: "1080",
      relationship: "moeder",
      occupation: "verpleegster",
      isEmergencyContact: true,
      notes: ""
    },
    {
      firstName: "Omar",
      lastName: "El Alaoui",
      email: "omar.elalaoui@example.com",
      phone: "0472834593",
      address: "Molenbeekstraat 45",
      city: "Brussel",
      postalCode: "1080",
      relationship: "vader",
      occupation: "tandarts",
      isEmergencyContact: true,
      notes: ""
    },
    {
      firstName: "Samira",
      lastName: "Hassani",
      email: "samira.hassani@example.com",
      phone: "0472834594",
      address: "Gentsesteenweg 125",
      city: "Brussel",
      postalCode: "1080",
      relationship: "moeder",
      occupation: "advocaat",
      isEmergencyContact: true,
      notes: ""
    },
    {
      firstName: "Samir",
      lastName: "Hassani",
      email: "samir.hassani@example.com",
      phone: "0472834595",
      address: "Gentsesteenweg 125",
      city: "Brussel",
      postalCode: "1080",
      relationship: "vader",
      occupation: "winkeleigenaar",
      isEmergencyContact: true,
      notes: ""
    }
  ];

  // Voeg de voogden toe aan de database
  for (const guardian of guardianData) {
    try {
      await db.insert(guardians).values(guardian).onConflictDoNothing();
      console.log(`Voogd toegevoegd: ${guardian.firstName} ${guardian.lastName}`);
    } catch (error) {
      console.error(`Fout bij toevoegen van voogd ${guardian.firstName} ${guardian.lastName}:`, error);
    }
  }

  console.log(`${guardianData.length} voogden toegevoegd!`);
}

main()
  .catch((e) => {
    console.error("Error in script:", e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("Script voltooid");
    process.exit(0);
  });