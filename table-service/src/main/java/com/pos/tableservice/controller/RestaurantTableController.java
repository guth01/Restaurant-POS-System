package com.pos.tableservice.controller;

import com.pos.tableservice.dto.CreateTableRequest;
import com.pos.tableservice.dto.TableResponse;
import com.pos.tableservice.enums.TableStatus;
import com.pos.tableservice.service.RestaurantTableService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tables")
@RequiredArgsConstructor
public class RestaurantTableController {

    private final RestaurantTableService tableService;

    // ---- Reads: any authenticated role ----

    @GetMapping
    public ResponseEntity<List<TableResponse>> getAll(@RequestParam(required = false) TableStatus status) {
        if (status != null) {
            return ResponseEntity.ok(tableService.getByStatus(status));
        }
        return ResponseEntity.ok(tableService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TableResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(tableService.getById(id));
    }

    // ---- Layout management: ADMIN only ----

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TableResponse> create(@Valid @RequestBody CreateTableRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tableService.create(request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tableService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ---- Status transitions: WAITER or ADMIN ----

    /**
     * Opens a table for a new dine-in session. The waiter ID is read from the
     * JWT (set by JwtFilter as a request attribute), never from the request
     * body — a waiter can only open a table as themselves.
     */
    @PutMapping("/{id}/open")
    @PreAuthorize("hasAnyRole('WAITER', 'ADMIN')")
    public ResponseEntity<TableResponse> openTable(@PathVariable Long id, HttpServletRequest request) {
        Long waiterId = (Long) request.getAttribute("userId");
        return ResponseEntity.ok(tableService.openTable(id, waiterId));
    }

    @PutMapping("/{id}/bill")
    @PreAuthorize("hasAnyRole('WAITER', 'ADMIN')")
    public ResponseEntity<TableResponse> billTable(@PathVariable Long id) {
        return ResponseEntity.ok(tableService.billTable(id));
    }

    /**
     * Frees the table back to AVAILABLE. In the full flow this gets called by
     * payment-service after a successful payment, but it's exposed here too
     * so you can test the full state machine manually before payment-service exists.
     */
    @PutMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('WAITER', 'ADMIN')")
    public ResponseEntity<TableResponse> closeTable(@PathVariable Long id) {
        return ResponseEntity.ok(tableService.closeTable(id));
    }
}
