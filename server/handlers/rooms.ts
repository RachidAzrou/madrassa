import { Request, Response } from "express";
import { db } from "../db";
import { eq, ilike, asc, desc, and, or, sql } from "drizzle-orm";
import { insertRoomSchema, rooms } from "@shared/schema";
import { validateRequest } from "../middleware/validate";

// GET /api/rooms - Alle lokalen ophalen
export const getRooms = async (req: Request, res: Response) => {
  try {
    const { searchTerm, status, location, page = '1', limit = '10' } = req.query as Record<string, string>;
    
    // Basisquery
    let query = db.select().from(rooms);
    
    // Zoekfilter toepassen indien opgegeven
    if (searchTerm) {
      query = query.where(
        or(
          ilike(rooms.name, `%${searchTerm}%`),
          ilike(rooms.location, `%${searchTerm}%`),
          ilike(rooms.notes, `%${searchTerm}%`)
        )
      );
    }
    
    // Statusfilter toepassen indien opgegeven
    if (status && status !== 'all') {
      query = query.where(eq(rooms.status, status));
    }
    
    // Locatiefilter toepassen indien opgegeven
    if (location && location !== 'all') {
      query = query.where(eq(rooms.location, location));
    }
    
    // Paginering
    const currentPage = parseInt(page);
    const itemsPerPage = parseInt(limit);
    const offset = (currentPage - 1) * itemsPerPage;
    
    // Totaal aantal lokalen (voor paginering)
    const countQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(rooms)
      .where(
        and(
          searchTerm
            ? or(
                ilike(rooms.name, `%${searchTerm}%`),
                ilike(rooms.location, `%${searchTerm}%`),
                ilike(rooms.notes, `%${searchTerm}%`)
              )
            : undefined,
          status && status !== 'all' ? eq(rooms.status, status) : undefined,
          location && location !== 'all' ? eq(rooms.location, location) : undefined
        )
      );
    
    const totalCount = countQuery[0]?.count || 0;
    
    // Resultaten ophalen met sortering en paginering
    const results = await query
      .orderBy(asc(rooms.name))
      .limit(itemsPerPage)
      .offset(offset);
    
    res.status(200).json({
      rooms: results,
      totalCount,
      currentPage,
      totalPages: Math.ceil(totalCount / itemsPerPage),
    });
  } catch (error: any) {
    console.error("Error fetching rooms:", error);
    res.status(500).json({ message: "Er is een fout opgetreden bij het ophalen van de lokalen." });
  }
};

// GET /api/rooms/locations - Unieke locaties ophalen voor filters
export const getLocations = async (req: Request, res: Response) => {
  try {
    const locationsResult = await db
      .selectDistinct({ location: rooms.location })
      .from(rooms)
      .orderBy(asc(rooms.location));
    
    const locations = locationsResult.map(item => item.location);
    
    res.status(200).json({ locations });
  } catch (error: any) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ message: "Er is een fout opgetreden bij het ophalen van de locaties." });
  }
};

// GET /api/rooms/:id - Specifiek lokaal ophalen
export const getRoomById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ message: "Ongeldig lokaal ID." });
    }
    
    const room = await db
      .select()
      .from(rooms)
      .where(eq(rooms.id, Number(id)))
      .limit(1);
    
    if (!room.length) {
      return res.status(404).json({ message: "Lokaal niet gevonden." });
    }
    
    res.status(200).json(room[0]);
  } catch (error: any) {
    console.error("Error fetching room:", error);
    res.status(500).json({ message: "Er is een fout opgetreden bij het ophalen van het lokaal." });
  }
};

// POST /api/rooms - Nieuw lokaal toevoegen
export const createRoom = [
  validateRequest({ body: insertRoomSchema }),
  async (req: Request, res: Response) => {
    try {
      // Controleer of er al een lokaal met dezelfde naam bestaat
      const existingRoom = await db
        .select()
        .from(rooms)
        .where(eq(rooms.name, req.body.name))
        .limit(1);
      
      if (existingRoom.length) {
        return res.status(400).json({ message: "Er bestaat al een lokaal met deze naam." });
      }
      
      // Voeg het nieuwe lokaal toe
      const result = await db.insert(rooms).values({
        name: req.body.name,
        capacity: req.body.capacity,
        location: req.body.location,
        status: req.body.status || "available",
        currentUse: req.body.currentUse,
        notes: req.body.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      res.status(201).json(result[0]);
    } catch (error: any) {
      console.error("Error creating room:", error);
      res.status(500).json({ message: "Er is een fout opgetreden bij het aanmaken van het lokaal." });
    }
  }
];

// PATCH /api/rooms/:id - Lokaal bijwerken
export const updateRoom = [
  validateRequest({ body: insertRoomSchema.partial() }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ message: "Ongeldig lokaal ID." });
      }
      
      // Controleer of het lokaal bestaat
      const existingRoom = await db
        .select()
        .from(rooms)
        .where(eq(rooms.id, Number(id)))
        .limit(1);
      
      if (!existingRoom.length) {
        return res.status(404).json({ message: "Lokaal niet gevonden." });
      }
      
      // Als de naam wordt gewijzigd, controleer of deze al in gebruik is
      if (req.body.name && req.body.name !== existingRoom[0].name) {
        const nameExists = await db
          .select()
          .from(rooms)
          .where(and(
            eq(rooms.name, req.body.name),
            sql`id != ${Number(id)}`
          ))
          .limit(1);
        
        if (nameExists.length) {
          return res.status(400).json({ message: "Er bestaat al een lokaal met deze naam." });
        }
      }
      
      // Werk het lokaal bij
      const result = await db.update(rooms)
        .set({
          ...req.body,
          updatedAt: new Date()
        })
        .where(eq(rooms.id, Number(id)))
        .returning();
      
      res.status(200).json(result[0]);
    } catch (error: any) {
      console.error("Error updating room:", error);
      res.status(500).json({ message: "Er is een fout opgetreden bij het bijwerken van het lokaal." });
    }
  }
];

// DELETE /api/rooms/:id - Lokaal verwijderen
export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ message: "Ongeldig lokaal ID." });
    }
    
    // Controleer of het lokaal bestaat
    const existingRoom = await db
      .select()
      .from(rooms)
      .where(eq(rooms.id, Number(id)))
      .limit(1);
    
    if (!existingRoom.length) {
      return res.status(404).json({ message: "Lokaal niet gevonden." });
    }
    
    // Verwijder het lokaal
    await db.delete(rooms)
      .where(eq(rooms.id, Number(id)));
    
    res.status(200).json({ message: "Lokaal succesvol verwijderd." });
  } catch (error: any) {
    console.error("Error deleting room:", error);
    res.status(500).json({ message: "Er is een fout opgetreden bij het verwijderen van het lokaal." });
  }
};