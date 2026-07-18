package com.researchsystem.backend.notification;

import com.researchsystem.backend.domain.entity.Notification;
import com.researchsystem.backend.domain.entity.Topic;
import com.researchsystem.backend.domain.entity.User;
import com.researchsystem.backend.domain.enums.SystemRole;
import com.researchsystem.backend.domain.enums.TopicStatus;
import com.researchsystem.backend.repository.NotificationRepository;
import com.researchsystem.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;
import java.util.Locale;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final MessageSource messageSource;

    /**
     * Executes asynchronously ONLY AFTER the database transaction has successfully committed.
     * Prevents sending notifications if the Topic status change was rolled back.
     */
    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleTopicStatusChanged(TopicStatusChangedEvent event) {
        Topic topic = event.getTopic();
        TopicStatus newStatus = event.getNewStatus();
        User actor = event.getActor();
        User investigator = topic.getInvestigator();
        
        // Force Vietnamese locale as per system requirements
        Locale locale = new Locale("vi", "VN"); 

        // Prepare dynamic arguments for message templating
        Object[] args = {
                topic.getTopicCode(),
                topic.getTitleVn(),
                actor.getFullName(),
                event.getFeedbackMessage() != null ? event.getFeedbackMessage() : "Không có"
        };

        String titleKey = "notification.topic.title.default";
        String bodyKey = "notification.topic.body.default";
        String notificationType = "TOPIC_STATUS_CHANGED";

        // --- ORCHESTRATION LOGIC (Semantic Routing) ---
        
        if (newStatus == TopicStatus.PENDING_REVIEW) {
            titleKey = "notification.topic.title.submitted";
            bodyKey = "notification.topic.body.submitted";
            notificationType = "TOPIC_SUBMITTED";
            // Notify Dept Head (Excluding the actor if they are somehow both)
            notifyDepartmentHeads(topic, titleKey, bodyKey, args, locale, notificationType, actor);
            
        } else if (newStatus == TopicStatus.DEPT_APPROVED) {
            titleKey = "notification.topic.title.dept_approved";
            bodyKey = "notification.topic.body.dept_approved";
            notificationType = "TOPIC_DEPT_APPROVED";
            // Notify Investigator
            sendNotification(investigator, titleKey, bodyKey, args, locale, notificationType, topic.getTopicId(), actor);
            
        } else if (newStatus == TopicStatus.DEPT_REJECTED) {
            titleKey = "notification.topic.title.dept_rejected";
            bodyKey = "notification.topic.body.dept_rejected";
            notificationType = "TOPIC_DEPT_REJECTED";
            // Notify Investigator
            sendNotification(investigator, titleKey, bodyKey, args, locale, notificationType, topic.getTopicId(), actor);
            
        } else if (newStatus == TopicStatus.REVISION_REQUIRED) {
            titleKey = "notification.topic.title.revision_required";
            bodyKey = "notification.topic.body.revision_required";
            notificationType = "TOPIC_REVISION_REQUIRED";
            // Notify Investigator AND Dept Heads
            sendNotification(investigator, titleKey, bodyKey, args, locale, notificationType, topic.getTopicId(), actor);
            notifyDepartmentHeads(topic, titleKey, bodyKey, args, locale, notificationType, actor);
            
        } else if (newStatus == TopicStatus.PENDING_COUNCIL) {
            titleKey = "notification.topic.title.council_pending";
            bodyKey = "notification.topic.body.council_pending";
            notificationType = "TOPIC_COUNCIL_PENDING";
            // Notify Investigator AND Dept Heads
            sendNotification(investigator, titleKey, bodyKey, args, locale, notificationType, topic.getTopicId(), actor);
            notifyDepartmentHeads(topic, titleKey, bodyKey, args, locale, notificationType, actor);
            
        } else if (newStatus == TopicStatus.APPROVED) {
            titleKey = "notification.topic.title.approved";
            bodyKey = "notification.topic.body.approved";
            notificationType = "TOPIC_APPROVED";
            // Notify Investigator AND Dept Heads
            sendNotification(investigator, titleKey, bodyKey, args, locale, notificationType, topic.getTopicId(), actor);
            notifyDepartmentHeads(topic, titleKey, bodyKey, args, locale, notificationType, actor);
            
        } else if (newStatus == TopicStatus.REJECTED) {
            titleKey = "notification.topic.title.rejected";
            bodyKey = "notification.topic.body.rejected";
            notificationType = "TOPIC_REJECTED";
            sendNotification(investigator, titleKey, bodyKey, args, locale, notificationType, topic.getTopicId(), actor);
            notifyDepartmentHeads(topic, titleKey, bodyKey, args, locale, notificationType, actor);
        }
    }

    private void notifyDepartmentHeads(Topic topic, String titleKey, String bodyKey, Object[] args, Locale locale, String type, User actor) {
        if (topic.getManagingDepartment() == null) return;
        List<User> deptHeads = userRepository.findByDepartmentDepartmentIdAndSystemRole(
                topic.getManagingDepartment().getDepartmentId(), SystemRole.DEPT_HEAD);
        
        for (User head : deptHeads) {
            sendNotification(head, titleKey, bodyKey, args, locale, type, topic.getTopicId(), actor);
        }
    }

    private void sendNotification(User recipient, String titleKey, String bodyKey, Object[] args, Locale locale, String type, Long topicId, User actor) {
        // Anti-redundancy check: Do not notify the person who just performed the action
        if (recipient.getUserId().equals(actor.getUserId())) {
            return; 
        }

        // Resolve natural language from messages_vi.properties
        String title = messageSource.getMessage(titleKey, null, titleKey, locale);
        String body = messageSource.getMessage(bodyKey, args, bodyKey, locale);

        Notification notification = Notification.builder()
                .recipient(recipient)
                .notificationType(type)
                .title(title)
                .body(body)
                .resourceType("TOPIC")
                .resourceId(topicId)
                .build();
        
        notificationRepository.save(notification);
        log.info("[Async Notification] Saved for {}: {}", recipient.getEmail(), title);
    }
}
