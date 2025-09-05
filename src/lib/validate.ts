import { z } from "zod";

export const locationInputSchema = z.object({
  input: z.string().min(1, "Enter a city, ZIP, landmark, or lat,lon"),
});

export const dateRangeSchema = z.object({
  dateStart: z.coerce.date(),
  dateEnd: z.coerce.date(),
}).refine(v => v.dateStart <= v.dateEnd, {
  message: "Start date must be before end date",
  path: ["dateStart"],
});

export const createRequestSchema = z.object({
  input: z.string().min(1),
  dateStart: z.string(),
  dateEnd: z.string(),
});
