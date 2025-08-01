package com.gifree.service;

import com.gifree.domain.Event;
import com.gifree.dto.PageRequestDTO;

import java.util.List;
import java.util.Optional;

public interface EventService {
    List<Event> getAllEvents(); // 선택적 유지
    Optional<Event> getEventById(Long id);
    Event createEvent(Event event);
    Event updateEvent(Long id, Event updatedEvent);
    void deleteEvent(Long id);

    // ✅ 추가된 페이징 기능
    List<Event> getList(PageRequestDTO requestDTO);
    long getTotalCount();
    

}