using IntakeApi.Dtos;
using IntakeApi.Exceptions;

namespace IntakeApi.Middleware;

/// <summary>
/// Fängt Exceptions zentral ab und übersetzt sie in passende HTTP-Statuscodes.
/// </summary>
public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (NotFoundException ex)
        {
            await WriteError(context, StatusCodes.Status404NotFound, ex.Message);
        }
        catch (ValidationException ex)
        {
            await WriteError(context, StatusCodes.Status400BadRequest, ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unerwarteter Fehler");
            await WriteError(context, StatusCodes.Status500InternalServerError, "Ein unerwarteter Fehler ist aufgetreten.");
        }
    }

    private static Task WriteError(HttpContext context, int statusCode, string message)
    {
        context.Response.StatusCode = statusCode;
        return context.Response.WriteAsJsonAsync(new ErrorResponseDto(message));
    }
}
