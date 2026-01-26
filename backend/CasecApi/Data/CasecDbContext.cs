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
    public DbSet<EventType> EventTypes { get; set; }
    
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

    // Poll entities
    public DbSet<Poll> Polls { get; set; }
    public DbSet<PollOption> PollOptions { get; set; }
    public DbSet<PollResponse> PollResponses { get; set; }

    // Survey entities
    public DbSet<Survey> Surveys { get; set; }
    public DbSet<SurveyQuestion> SurveyQuestions { get; set; }
    public DbSet<SurveyResponse> SurveyResponses { get; set; }
    public DbSet<SurveyAnswer> SurveyAnswers { get; set; }

    // Payment configuration entities
    public DbSet<PaymentMethod> PaymentMethods { get; set; }

    // SlideShow entities
    public DbSet<SlideShow> SlideShows { get; set; }
    public DbSet<Slide> Slides { get; set; }
    public DbSet<SlideImage> SlideImages { get; set; }
    public DbSet<SlideText> SlideTexts { get; set; }
    public DbSet<SharedVideo> SharedVideos { get; set; }
    public DbSet<SharedImage> SharedImages { get; set; }

    // NEW: Object-oriented slide entities
    public DbSet<SlideObject> SlideObjects { get; set; }
    public DbSet<SlideBackgroundVideo> SlideBackgroundVideos { get; set; }
    // Raffle entities
    public DbSet<Raffle> Raffles { get; set; }
    public DbSet<RafflePrize> RafflePrizes { get; set; }
    public DbSet<RaffleTicketTier> RaffleTicketTiers { get; set; }
    public DbSet<RaffleParticipant> RaffleParticipants { get; set; }

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
                .WithMany(u => u.ClubMemberships)
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

            // Configure table to work with database trigger
            entity.ToTable(t => t.HasTrigger("TR_PasswordResetTokens_SendEmail"));
        });

        // EventType entity configuration
        modelBuilder.Entity<EventType>(entity =>
        {
            entity.HasKey(e => e.EventTypeId);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.Property(e => e.DisplayName).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.Code).IsUnique();
        });

        // Poll entity configuration
        modelBuilder.Entity<Poll>(entity =>
        {
            entity.HasKey(e => e.PollId);
            entity.Property(e => e.Question).IsRequired().HasMaxLength(500);
            entity.Property(e => e.PollType).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Visibility).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);

            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.IsFeatured);
        });

        // PollOption entity configuration
        modelBuilder.Entity<PollOption>(entity =>
        {
            entity.HasKey(e => e.OptionId);
            entity.Property(e => e.OptionText).IsRequired().HasMaxLength(500);

            entity.HasOne(e => e.Poll)
                .WithMany(p => p.Options)
                .HasForeignKey(e => e.PollId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.PollId);
        });

        // PollResponse entity configuration
        modelBuilder.Entity<PollResponse>(entity =>
        {
            entity.HasKey(e => e.ResponseId);

            entity.HasOne(e => e.Poll)
                .WithMany(p => p.Responses)
                .HasForeignKey(e => e.PollId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.PollId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.SessionId);
        });

        // Survey entity configuration
        modelBuilder.Entity<Survey>(entity =>
        {
            entity.HasKey(e => e.SurveyId);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Visibility).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);

            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.Status);
            entity.HasIndex(e => e.IsFeatured);
        });

        // SurveyQuestion entity configuration
        modelBuilder.Entity<SurveyQuestion>(entity =>
        {
            entity.HasKey(e => e.QuestionId);
            entity.Property(e => e.QuestionText).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.QuestionType).IsRequired().HasMaxLength(50);

            entity.HasOne(e => e.Survey)
                .WithMany(s => s.Questions)
                .HasForeignKey(e => e.SurveyId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ConditionalOnQuestion)
                .WithMany()
                .HasForeignKey(e => e.ConditionalOnQuestionId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.SurveyId);
            entity.HasIndex(e => new { e.SurveyId, e.DisplayOrder });
        });

        // SurveyResponse entity configuration
        modelBuilder.Entity<SurveyResponse>(entity =>
        {
            entity.HasKey(e => e.ResponseId);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);

            entity.HasOne(e => e.Survey)
                .WithMany(s => s.Responses)
                .HasForeignKey(e => e.SurveyId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.SurveyId);
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.SessionId);
            entity.HasIndex(e => e.Status);
        });

        // SurveyAnswer entity configuration
        modelBuilder.Entity<SurveyAnswer>(entity =>
        {
            entity.HasKey(e => e.AnswerId);

            entity.HasOne(e => e.Response)
                .WithMany(r => r.Answers)
                .HasForeignKey(e => e.ResponseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Question)
                .WithMany()
                .HasForeignKey(e => e.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.ResponseId);
            entity.HasIndex(e => e.QuestionId);
            entity.HasIndex(e => new { e.ResponseId, e.QuestionId }).IsUnique();
        });

        // PaymentMethod entity configuration
        modelBuilder.Entity<PaymentMethod>(entity =>
        {
            entity.HasKey(e => e.PaymentMethodId);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => e.DisplayOrder);
        });

        // SlideShow entity configuration
        modelBuilder.Entity<SlideShow>(entity =>
        {
            entity.HasKey(e => e.SlideShowId);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.HasIndex(e => e.Code).IsUnique();
            entity.HasIndex(e => e.IsActive);
        });

        // Raffle entity configuration
        modelBuilder.Entity<Raffle>(entity =>
        {
            entity.HasKey(e => e.RaffleId);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Status).IsRequired().HasMaxLength(50);
            entity.Property(e => e.TotalRevenue).HasColumnType("decimal(10, 2)");

            entity.HasOne(e => e.CreatedByUser)
                .WithMany()
                .HasForeignKey(e => e.CreatedBy)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Slide entity configuration
        modelBuilder.Entity<Slide>(entity =>
        {
            entity.HasKey(e => e.SlideId);

            entity.HasOne(e => e.SlideShow)
                .WithMany(s => s.Slides)
                .HasForeignKey(e => e.SlideShowId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.SlideShowId);
            entity.HasIndex(e => new { e.SlideShowId, e.DisplayOrder });
        });

        // SlideImage entity configuration
        modelBuilder.Entity<SlideImage>(entity =>
        {
            entity.HasKey(e => e.SlideImageId);
            entity.Property(e => e.ImageUrl).IsRequired().HasMaxLength(500);

            entity.HasOne(e => e.Slide)
                .WithMany(s => s.Images)
                .HasForeignKey(e => e.SlideId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.SlideId);
            entity.HasIndex(e => new { e.SlideId, e.DisplayOrder });
        });

        // SharedVideo entity configuration
        modelBuilder.Entity<SharedVideo>(entity =>
        {
            entity.HasKey(e => e.VideoId);
            entity.Property(e => e.Url).IsRequired().HasMaxLength(500);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.DisplayOrder);
        });

        // SharedImage entity configuration
        modelBuilder.Entity<SharedImage>(entity =>
        {
            entity.HasKey(e => e.ImageId);
            entity.Property(e => e.Url).IsRequired().HasMaxLength(500);
            entity.HasIndex(e => e.IsActive);
            entity.HasIndex(e => e.Category);
            entity.HasIndex(e => e.DisplayOrder);

            entity.HasIndex(e => e.Status);
        });

        // RafflePrize entity configuration
        modelBuilder.Entity<RafflePrize>(entity =>
        {
            entity.HasKey(e => e.PrizeId);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Value).HasColumnType("decimal(10, 2)");

            entity.HasOne(e => e.Raffle)
                .WithMany(r => r.Prizes)
                .HasForeignKey(e => e.RaffleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.RaffleId);
            entity.HasIndex(e => new { e.RaffleId, e.DisplayOrder });
        });

        // RaffleTicketTier entity configuration
        modelBuilder.Entity<RaffleTicketTier>(entity =>
        {
            entity.HasKey(e => e.TierId);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Price).IsRequired().HasColumnType("decimal(10, 2)");

            entity.HasOne(e => e.Raffle)
                .WithMany(r => r.TicketTiers)
                .HasForeignKey(e => e.RaffleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.RaffleId);
            entity.HasIndex(e => new { e.RaffleId, e.DisplayOrder });
        });

        // RaffleParticipant entity configuration
        modelBuilder.Entity<RaffleParticipant>(entity =>
        {
            entity.HasKey(e => e.ParticipantId);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PhoneNumber).IsRequired().HasMaxLength(30);
            entity.Property(e => e.TotalPaid).HasColumnType("decimal(10, 2)");

            entity.HasOne(e => e.Raffle)
                .WithMany(r => r.Participants)
                .HasForeignKey(e => e.RaffleId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.RaffleId);
            entity.HasIndex(e => e.PhoneNumber);
            entity.HasIndex(e => e.SessionToken);
            entity.HasIndex(e => new { e.RaffleId, e.PhoneNumber }).IsUnique();
        });
    }
}
