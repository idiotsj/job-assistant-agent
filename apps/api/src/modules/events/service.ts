import { type EventRepository } from "@/modules/events/repository";
import { type EventListQuery } from "@/modules/events/schema";

export interface EventsService {
  listEvents(query: EventListQuery): ReturnType<EventRepository["list"]>;
}

export function createEventsService(repository: EventRepository): EventsService {
  return {
    listEvents(query) {
      return repository.list(query);
    },
  };
}

