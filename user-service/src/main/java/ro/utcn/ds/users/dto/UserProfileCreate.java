package ro.utcn.ds.users.dto;

public record UserProfileCreate(
        Long authId,
        String username,
        String email,
        String fullName,
        String role
) {}
