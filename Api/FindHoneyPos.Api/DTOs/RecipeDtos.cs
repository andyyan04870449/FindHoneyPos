namespace FindHoneyPos.Api.DTOs;

public record RecipeItemRequest(
    int MaterialId,
    decimal Quantity
);

public record UpdateRecipesRequest(
    List<RecipeItemRequest> Recipes
);

public record RecipeResponse(
    int Id,
    int ProductId,
    int MaterialId,
    string MaterialName,
    string MaterialUnit,
    decimal Quantity
);

public record ProductWithRecipesResponse(
    int Id,
    string Name,
    string? Category,
    List<RecipeResponse> Recipes
);
