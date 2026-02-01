# ---------- build stage ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG APP_VERSION=0.0.0-dev
WORKDIR /src

# Copy csproj files first for layer caching
COPY FindHoneyPos.Core/FindHoneyPos.Core.csproj FindHoneyPos.Core/
COPY FindHoneyPos.Infrastructure/FindHoneyPos.Infrastructure.csproj FindHoneyPos.Infrastructure/
COPY FindHoneyPos.Api/FindHoneyPos.Api.csproj FindHoneyPos.Api/
RUN dotnet restore FindHoneyPos.Api/FindHoneyPos.Api.csproj

# Copy everything and publish
COPY . .
RUN dotnet publish FindHoneyPos.Api/FindHoneyPos.Api.csproj \
    -c Release \
    -o /app/publish \
    /p:Version=${APP_VERSION}

# ---------- runtime stage ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80

ENTRYPOINT ["dotnet", "FindHoneyPos.Api.dll"]
