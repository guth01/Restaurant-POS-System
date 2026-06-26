package com.pos.menuservice.service;

import com.pos.menuservice.dto.CreateMenuItemRequest;
import com.pos.menuservice.dto.MenuItemResponse;
import com.pos.menuservice.dto.UpdateMenuItemRequest;

import java.util.List;

public interface MenuItemService {
    MenuItemResponse create(CreateMenuItemRequest request);
    MenuItemResponse update(Long id, UpdateMenuItemRequest request);
    void delete(Long id);
    MenuItemResponse getById(Long id);
    List<MenuItemResponse> getAll();
    List<MenuItemResponse> getByCategory(String category);
    List<MenuItemResponse> getAvailable();
}
