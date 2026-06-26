package com.pos.tableservice.service;

import com.pos.tableservice.dto.CreateTableRequest;
import com.pos.tableservice.dto.TableResponse;
import com.pos.tableservice.entity.RestaurantTable;
import com.pos.tableservice.enums.TableStatus;
import com.pos.tableservice.exception.InvalidTableStateException;
import com.pos.tableservice.exception.ResourceNotFoundException;
import com.pos.tableservice.repository.RestaurantTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RestaurantTableServiceImpl implements RestaurantTableService {

    private final RestaurantTableRepository tableRepository;

    @Override
    public TableResponse create(CreateTableRequest request) {
        if (tableRepository.existsByTableNumber(request.getTableNumber())) {
            throw new InvalidTableStateException(
                    "Table number " + request.getTableNumber() + " already exists");
        }

        RestaurantTable table = RestaurantTable.builder()
                .tableNumber(request.getTableNumber())
                .capacity(request.getCapacity())
                .status(TableStatus.AVAILABLE)
                .build();

        return toResponse(tableRepository.save(table));
    }

    @Override
    public void delete(Long id) {
        RestaurantTable table = findOrThrow(id);
        tableRepository.delete(table);
    }

    @Override
    public TableResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Override
    public List<TableResponse> getAll() {
        return tableRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public List<TableResponse> getByStatus(TableStatus status) {
        return tableRepository.findByStatus(status).stream().map(this::toResponse).toList();
    }

    /**
     * Waiter opens a table for a new dine-in session. waiterId comes from the
     * JWT (request attribute "userId"), not from the request body, so a waiter
     * cannot open a table on someone else's behalf.
     */
    @Override
    public TableResponse openTable(Long id, Long waiterId) {
        RestaurantTable table = findOrThrow(id);

        if (table.getStatus() != TableStatus.AVAILABLE) {
            throw new InvalidTableStateException(
                    "Table " + table.getTableNumber() + " is not AVAILABLE (current status: " + table.getStatus() + ")");
        }

        table.setStatus(TableStatus.OCCUPIED);
        table.setAssignedWaiterId(waiterId);
        table.setOpenedAt(LocalDateTime.now());

        return toResponse(tableRepository.save(table));
    }

    /**
     * Waiter requests the bill. Table moves to BILLED — still occupied in
     * practice, but signals payment-service should now calculate the total.
     */
    @Override
    public TableResponse billTable(Long id) {
        RestaurantTable table = findOrThrow(id);

        if (table.getStatus() != TableStatus.OCCUPIED) {
            throw new InvalidTableStateException(
                    "Table " + table.getTableNumber() + " must be OCCUPIED to bill (current status: " + table.getStatus() + ")");
        }

        table.setStatus(TableStatus.BILLED);
        return toResponse(tableRepository.save(table));
    }

    /**
     * Called once payment-service confirms payment SUCCESS. Frees the table
     * back up for the next walk-in.
     */
    @Override
    public TableResponse closeTable(Long id) {
        RestaurantTable table = findOrThrow(id);

        if (table.getStatus() != TableStatus.BILLED) {
            throw new InvalidTableStateException(
                    "Table " + table.getTableNumber() + " must be BILLED to close (current status: " + table.getStatus() + ")");
        }

        table.setStatus(TableStatus.AVAILABLE);
        table.setAssignedWaiterId(null);
        table.setOpenedAt(null);

        return toResponse(tableRepository.save(table));
    }

    private RestaurantTable findOrThrow(Long id) {
        return tableRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found with id: " + id));
    }

    private TableResponse toResponse(RestaurantTable table) {
        return TableResponse.builder()
                .id(table.getId())
                .tableNumber(table.getTableNumber())
                .capacity(table.getCapacity())
                .status(table.getStatus())
                .assignedWaiterId(table.getAssignedWaiterId())
                .openedAt(table.getOpenedAt())
                .build();
    }
}
