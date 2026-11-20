using IntakeApi.Configuration;
using IntakeApi.Middleware;
using IntakeApi.Services;
using IntakeApi.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

const string FrontendCorsPolicy = "Frontend";

// ---------- Konfiguration ----------
builder.Services.Configure<IntakeOptions>(builder.Configuration.GetSection(IntakeOptions.SectionName));

// ---------- Services (Dependency Injection) ----------
builder.Services.AddSingleton<ISessionStore, InMemorySessionStore>();
builder.Services.AddSingleton<ITargetFormatService, TargetFormatService>();
builder.Services.AddScoped<IExcelReaderService, ExcelReaderService>();
builder.Services.AddScoped<IExcelExportService, ExcelExportService>();
builder.Services.AddScoped<IMappingService, MappingService>();
builder.Services.AddScoped<IIntakeService, IntakeService>();

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:4200"];
    options.AddPolicy(FrontendCorsPolicy, policy => policy
        .WithOrigins(origins)
        .AllowAnyHeader()
        .AllowAnyMethod()
        .WithExposedHeaders("Content-Disposition"));
});

var app = builder.Build();

// ---------- HTTP-Pipeline ----------
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi(); // OpenAPI-Dokument unter /openapi/v1.json
}

app.UseCors(FrontendCorsPolicy);
app.MapControllers();

app.Run();
