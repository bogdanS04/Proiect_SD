package ro.utcn.ds.device.dto;

public record DeviceCreateRequest(Long userAuthId, String name, String description, String status) {}

