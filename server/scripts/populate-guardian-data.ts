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
      gender: "vrouw",
      nationalId: "750212345678"
    },
    {
      firstName: "Karim",
      lastName: "El Hakim",
      email: "karim.elhakim@example.com",
      phone: "0475834567",
      address: "Molenbeekstraat 28",
      city: "Antwerpen",
      postalCode: "2000",
      relation: "vader",
      occupation: "ingenieur",
      gender: "man",
      nationalId: "730212345678"
    },
    {
      firstName: "Soraya",
      lastName: "Benali",
      email: "soraya.benali@example.com",
      phone: "0472834561",
      address: "Kerkstraat 15",
      city: "Brussel",
      postalCode: "1020",
      relation: "moeder",
      occupation: "leraar",
      gender: "vrouw",
      nationalId: "760212345678"
    },
    {
      firstName: "Mohammed",
      lastName: "Benali",
      email: "mohammed.benali@example.com",
      phone: "0472834562",
      address: "Kerkstraat 15",
      city: "Brussel",
      postalCode: "1020",
      relation: "vader",
      occupation: "IT specialist",
      gender: "man",
      nationalId: "740212345678"
    },
    {
      firstName: "Fatima",
      lastName: "El Mouden",
      email: "fatima.elmouden@example.com",
      phone: "0472836561",
      address: "Leuvenseweg 89",
      city: "Brussel",
      postalCode: "1000",
      relation: "moeder",
      occupation: "dokter",
      gender: "vrouw",
      nationalId: "770212345678"
    },
    {
      firstName: "Ahmed",
      lastName: "El Mouden",
      email: "ahmed.elmouden@example.com",
      phone: "0472834592",
      address: "Leuvenseweg 89",
      city: "Brussel",
      postalCode: "1000",
      relation: "vader",
      occupation: "architect",
      gender: "man",
      nationalId: "740213345678"
    },
    {
      firstName: "Yasmine",
      lastName: "El Alaoui",
      email: "yasmine.elalaoui@example.com",
      phone: "0472834591",
      address: "Molenbeekstraat 45",
      city: "Brussel",
      postalCode: "1080",
      relation: "moeder",
      occupation: "verpleegster",
      gender: "vrouw",
      nationalId: "780212345678"
    },
    {
      firstName: "Omar",
      lastName: "El Alaoui",
      email: "omar.elalaoui@example.com",
      phone: "0472834593",
      address: "Molenbeekstraat 45",
      city: "Brussel",
      postalCode: "1080",
      relation: "vader",
      occupation: "tandarts",
      gender: "man",
      nationalId: "720212345678"
    },
    {
      firstName: "Samira",
      lastName: "Hassani",
      email: "samira.hassani@example.com",
      phone: "0472834594",
      address: "Gentsesteenweg 125",
      city: "Brussel",
      postalCode: "1080",
      relation: "moeder",
      occupation: "advocaat",
      gender: "vrouw",
      nationalId: "790212345678"
    },
    {
      firstName: "Samir",
      lastName: "Hassani",
      email: "samir.hassani@example.com",
      phone: "0472834595",
      address: "Gentsesteenweg 125",
      city: "Brussel",
      postalCode: "1080",
      relation: "vader",
      occupation: "winkeleigenaar",
      gender: "man",
      nationalId: "710212345678"
    }
  ];

  // Voeg de voogden toe aan de database
  for (const guardian of guardianData) {
    await db.insert(guardians).values(guardian).onConflictDoNothing();
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