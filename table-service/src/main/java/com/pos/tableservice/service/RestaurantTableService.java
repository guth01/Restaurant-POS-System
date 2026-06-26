package com.pos.tableservice.service;

import com.pos.tableservice.dto.CreateTableRequest;
import com.pos.tableservice.dto.TableResponse;
import com.pos.tableservice.enums.TableStatus;

import java.util.List;

public interface RestaurantTableService {
    TableResponse create(CreateTableRequest request);
    void delete(Long id);
    TableResponse getById(Long id);
    List<TableResponse> getAll();
    List<TableResponse> getByStatus(TableStatus status);

    TableResponse openTable(Long id, Long waiterId);
    TableResponse billTable(Long id);
    TableResponse closeTable(Long id);
}
