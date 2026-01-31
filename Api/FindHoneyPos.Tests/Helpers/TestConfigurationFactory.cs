namespace FindHoneyPos.Tests.Helpers;

using Microsoft.Extensions.Configuration;

public static class TestConfigurationFactory
{
    public static IConfiguration Create()
    {
        var settings = new Dictionary<string, string?>
        {
            ["Jwt:Secret"] = "TestSecretKeyForUnitTestsThatIsLongEnough123456",
            ["Jwt:Issuer"] = "TestIssuer",
            ["Jwt:Audience"] = "TestAudience",
            ["Jwt:ExpiryHours"] = "24",
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();
    }
}
