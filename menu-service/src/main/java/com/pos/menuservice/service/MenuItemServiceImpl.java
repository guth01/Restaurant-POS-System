package com.pos.menuservice.service;

import com.pos.menuservice.dto.CreateMenuItemRequest;
import com.pos.menuservice.dto.MenuItemResponse;
import com.pos.menuservice.dto.UpdateMenuItemRequest;
import com.pos.menuservice.entity.MenuItem;
import com.pos.menuservice.exception.ResourceNotFoundException;
import com.pos.menuservice.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MenuItemServiceImpl implements MenuItemService {

    private final MenuItemRepository menuItemRepository;

    @Override
    public MenuItemResponse create(CreateMenuItemRequest request) {
        MenuItem item = MenuItem.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .category(request.getCategory())
                .taxRate(request.getTaxRate())
                .isAvailable(request.isAvailable())
                .prepTimeMinutes(request.getPrepTimeMinutes())
                .build();

        return toResponse(menuItemRepository.save(item));
    }

    @Override
    public MenuItemResponse update(Long id, UpdateMenuItemRequest request) {
        MenuItem item = findOrThrow(id);

        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setPrice(request.getPrice());
        item.setCategory(request.getCategory());
        item.setTaxRate(request.getTaxRate());
        item.setAvailable(request.isAvailable());
        item.setPrepTimeMinutes(request.getPrepTimeMinutes());

        return toResponse(menuItemRepository.save(item));
    }

    @Override
    public void delete(Long id) {
        MenuItem item = findOrThrow(id);
        menuItemRepository.delete(item);
    }

    @Override
    public MenuItemResponse getById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Override
    public List<MenuItemResponse> getAll() {
        return menuItemRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public List<MenuItemResponse> getByCategory(String category) {
        return menuItemRepository.findByCategoryIgnoreCase(category).stream().map(this::toResponse).toList();
    }

    @Override
    public List<MenuItemResponse> getAvailable() {
        return menuItemRepository.findByIsAvailableTrue().stream().map(this::toResponse).toList();
    }

    private MenuItem findOrThrow(Long id) {
        return menuItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with id: " + id));
    }

    private MenuItemResponse toResponse(MenuItem item) {
        return MenuItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .description(item.getDescription())
                .price(item.getPrice())
                .category(item.getCategory())
                .taxRate(item.getTaxRate())
                .isAvailable(item.isAvailable())
                .prepTimeMinutes(item.getPrepTimeMinutes())
                .build();
    }
}
