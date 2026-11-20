using System.Collections.Concurrent;
using IntakeApi.Models;
using IntakeApi.Services.Interfaces;

namespace IntakeApi.Services;

/// <summary>
/// Einfache In-Memory-Ablage für Sessions. Für den Prototyp ausreichend –
/// nach einem Neustart des Backends sind alle Sessions weg.
/// </summary>
public class InMemorySessionStore : ISessionStore
{
    private static readonly TimeSpan MaxAge = TimeSpan.FromHours(2);
    private readonly ConcurrentDictionary<Guid, IntakeSession> _sessions = new();

    public void Save(IntakeSession session)
    {
        RemoveExpired();
        _sessions[session.Id] = session;
    }

    public IntakeSession? Get(Guid id) =>
        _sessions.TryGetValue(id, out var session) ? session : null;

    private void RemoveExpired()
    {
        var threshold = DateTime.UtcNow - MaxAge;
        foreach (var (id, session) in _sessions)
        {
            if (session.CreatedAt < threshold)
            {
                _sessions.TryRemove(id, out _);
            }
        }
    }
}
