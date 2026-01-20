using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using CasecApi.Data;
using CasecApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel for large file uploads (100MB for videos)
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 110 * 1024 * 1024; // 110MB to allow some overhead
});

// Configure form options for large file uploads
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 110 * 1024 * 1024; // 110MB
});

// Add services to the container
builder.Services.AddDbContext<CasecDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add File Storage Service
builder.Services.Configure<FileStorageSettings>(
    builder.Configuration.GetSection("FileStorage"));

var storageProvider = builder.Configuration.GetValue<string>("FileStorage:Provider") ?? "Local";
if (storageProvider.Equals("S3", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddSingleton<IFileStorageService, S3FileStorageService>();
}
else
{
    builder.Services.AddSingleton<IFileStorageService, LocalFileStorageService>();
}

// Add Asset Service (wraps file storage and saves to database)
builder.Services.AddScoped<IAssetService, AssetService>();

// Add HttpClient for URL metadata fetching
builder.Services.AddHttpClient();

// Add Authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "DefaultSecretKeyForDevelopmentOnly123!";
var key = Encoding.ASCII.GetBytes(jwtKey);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false; // Set to true in production
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "CasecApi",
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "CasecApp",
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });

    // Load production CORS origins from configuration
    var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
    options.AddPolicy("Production", policy =>
    {
        if (corsOrigins.Length > 0)
        {
            policy.WithOrigins(corsOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
        else
        {
            // Fallback if no origins configured
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        }
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddEndpointsApiExplorer();

// Add Swagger with JWT support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "CASEC Membership API",
        Version = "v1",
        Description = "API for CASEC Community Membership Management System",
        Contact = new OpenApiContact
        {
            Name = "CASEC",
            Email = "admin@casec.org"
        }
    });

    // Add JWT Authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
// Enable Swagger in all environments (can be disabled via config if needed)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    // Use relative path so it works regardless of base path
    c.SwaggerEndpoint("v1/swagger.json", "CASEC API V1");
    c.RoutePrefix = "swagger";
});

// Only use HTTPS redirection if explicitly enabled
var useHttpsRedirection = builder.Configuration.GetValue<bool>("UseHttpsRedirection", false);
if (useHttpsRedirection)
{
    app.UseHttpsRedirection();
}

// Use CORS - change to "Production" in production environment
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

// Serve static files (for frontend)
app.UseStaticFiles();

app.MapControllers();

// Default route for API info
app.MapGet("/", () => new
{
    name = "CASEC Membership API",
    version = "1.0.0",
    status = "Running",
    documentation = "/swagger",
    endpoints = new[]
    {
        "/auth/register",
        "/auth/login",
        "/membershiptypes",
        "/clubs",
        "/events",
        "/users/profile",
        "/users/dashboard",
        "/payments/process",
        "/asset/{id}"
    }
});

app.Run();
