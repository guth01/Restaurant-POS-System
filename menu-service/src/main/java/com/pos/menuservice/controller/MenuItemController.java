package com.pos.menuservice.controller;

import com.pos.menuservice.dto.CreateMenuItemRequest;
import com.pos.menuservice.dto.MenuItemResponse;
import com.pos.menuservice.dto.UpdateMenuItemRequest;
import com.pos.menuservice.service.MenuItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/menu-items")
@RequiredArgsConstructor
public class MenuItemController {

    private final MenuItemService menuItemService;

    // ---- Reads: any authenticated role (ADMIN, WAITER, KITCHEN) ----

    @GetMapping
    public ResponseEntity<List<MenuItemResponse>> getAll(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean availableOnly) {

        if (category != null) {
            return ResponseEntity.ok(menuItemService.getByCategory(category));
        }
        if (Boolean.TRUE.equals(availableOnly)) {
            return ResponseEntity.ok(menuItemService.getAvailable());
        }
        return ResponseEntity.ok(menuItemService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MenuItemResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(menuItemService.getById(id));
    }

    // ---- Writes: ADMIN only ----

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MenuItemResponse> create(@Valid @RequestBody CreateMenuItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(menuItemService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MenuItemResponse> update(
            @PathVariable Long id, @Valid @RequestBody UpdateMenuItemRequest request) {
        return ResponseEntity.ok(menuItemService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        menuItemService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
