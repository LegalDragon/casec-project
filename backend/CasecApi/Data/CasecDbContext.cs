using Microsoft.EntityFrameworkCore;
using CasecApi.Models;

namespace CasecApi.Data;

public class CasecDbContext : DbContext
{
    public CasecDbContext(DbContextOptions<CasecDbContext> options) : base(options)
    {
    }

    // Core entities
    public DbSet<User> Users { get; set; }
    public DbSet<MembershipType> MembershipTypes { get; set; }
    public DbSet<MembershipDuration> MembershipDurations { get; set; }
    public DbSet<MembershipPayment> MembershipPayments { get; set; }
    public DbSet<ActivityLog> ActivityLogs { get; set; }
    
    // Club entities
    public DbSet<Club> Clubs { get; set; }
    public DbSet<ClubMembership> ClubMemberships { get; set; }
    public DbSet<ClubAdmin> ClubAdmins { get; set; }
    
    // Event entities
    public DbSet<Event> Events { get; set; }
    public DbSet<EventRegistration> EventRegistrations { get; set; }
    
    // Family entities
    public DbSet<FamilyGroup> FamilyGroups { get; set; }
    public DbSet<FamilyMember> FamilyMembers { get; set; }
    
    // Theme entities
    public DbSet<ThemeSettings> ThemeSettings { get; set; }
    public DbSet<ThemePreset> ThemePresets { get; set; }

    // Asset entities
    public DbSet<Asset> Assets { get; set; }

    // Auth entities
    public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User entity configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.FirstName).IsRequired().HasMaxLength(50);
            entity.Property(e => e.LastName).IsRequired().HasMaxLength(50);
            entity.HasIndex(e => e.Email).IsUnique();
            
            // Relationships
            entity.HasOne(e => e.MembershipType)
                .WithMany()
                .HasForeignKey(e => e.MembershipTypeId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.HasOne(e => e.FamilyGroup)
                .WithMany(f => f.Members)
                .HasForeignKey(e => e.FamilyGroupId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // MembershipType entity configuration
        modelBuilder.Entity<MembershipType>(entity =>
        {
            entity.HasKey(e => e.MembershipTypeId);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Price).HasColumnType("decimal(10, 2)");
        });

        // MembershipPayment entity configuration
        modelBuilder.Entity<MembershipPayment>(entity =>
        {
            entity.HasKey(e => e.PaymentId);
            entity.Property(e => e.Amount).HasColumnType("decimal(10, 2)");
            
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.MembershipType)
                .WithMany()
                .HasForeignKey(e => e.MembershipTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Club entity configuration
        modelBuilder.Entity<Club>(entity =>
        {
            entity.HasKey(e => e.ClubId);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
        });

        // ClubMembership entity configuration
        modelBuilder.Entity<ClubMembership>(entity =>
        {
            entity.HasKey(e => e.MembershipId);
            
            entity.HasOne(e => e.Club)
                .WithMany(c => c.Memberships)
                .HasForeignKey(e => e.ClubId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.ClubId, e.UserId }).IsUnique();
        });

        // ClubAdmin entity configuration
        modelBuilder.Entity<ClubAdmin>(entity =>
        {
            entity.HasKey(e => e.ClubAdminId);
            
            entity.HasOne(e => e.Club)
                .WithMany(c => c.Admins)
                .HasForeignKey(e => e.ClubId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.AssignedByUser)
                .WithMany()
                .HasForeignKey(e => e.AssignedBy)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => new { e.ClubId, e.UserId }).IsUnique();
        });

        // Event entity configuration
        modelBuilder.Entity<Event>(entity =>
        {
            entity.HasKey(e => e.EventId);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.EventFee).HasColumnType("decimal(10, 2)");
            
            entity.HasOne(e => e.HostClub)
                .WithMany(c => c.HostedEvents)
                .HasForeignKey(e => e.HostClubId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // EventRegistration entity configuration
        modelBuilder.Entity<EventRegistration>(entity =>
        {
            entity.HasKey(e => e.RegistrationId);
            
            entity.HasOne(e => e.Event)
                .WithMany()
                .HasForeignKey(e => e.EventId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => new { e.EventId, e.UserId }).IsUnique();
        });

        // FamilyGroup entity configuration
        modelBuilder.Entity<FamilyGroup>(entity =>
        {
            entity.HasKey(e => e.FamilyGroupId);
            entity.Property(e => e.FamilyName).IsRequired().HasMaxLength(200);
            
            entity.HasOne(e => e.PrimaryUser)
                .WithMany()
                .HasForeignKey(e => e.PrimaryUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ActivityLog entity configuration
        modelBuilder.Entity<ActivityLog>(entity =>
        {
            entity.HasKey(e => e.LogId);
            entity.Property(e => e.ActivityType).IsRequired().HasMaxLength(50);
            
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ThemeSettings entity configuration
        modelBuilder.Entity<ThemeSettings>(entity =>
        {
            entity.HasKey(e => e.ThemeId);
            entity.Property(e => e.OrganizationName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.PrimaryColor).IsRequired().HasMaxLength(50);
            entity.Property(e => e.AccentColor).IsRequired().HasMaxLength(50);
            
            entity.HasOne(e => e.UpdatedByUser)
                .WithMany()
                .HasForeignKey(e => e.UpdatedBy)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ThemePreset entity configuration
        modelBuilder.Entity<ThemePreset>(entity =>
        {
            entity.HasKey(e => e.PresetId);
            entity.Property(e => e.PresetName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PrimaryColor).IsRequired().HasMaxLength(50);
            entity.Property(e => e.AccentColor).IsRequired().HasMaxLength(50);
        });

        // Asset entity configuration
        modelBuilder.Entity<Asset>(entity =>
        {
            entity.HasKey(e => e.FileId);
            entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.OriginalFileName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.ContentType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.StorageProvider).IsRequired().HasMaxLength(50);
            entity.Property(e => e.StoragePath).IsRequired().HasMaxLength(1000);

            entity.HasOne(e => e.UploadedByUser)
                .WithMany()
                .HasForeignKey(e => e.UploadedBy)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => new { e.ObjectType, e.ObjectId });
            entity.HasIndex(e => e.UploadedBy);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.Folder);
        });

        // PasswordResetToken entity configuration
        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.HasKey(e => e.TokenId);
            entity.Property(e => e.Token).IsRequired().HasMaxLength(100);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.Token).IsUnique();
        });
    }
}
